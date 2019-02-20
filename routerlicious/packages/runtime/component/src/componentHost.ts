import {
    ConnectionState,
    FileMode,
    IBlobManager,
    IDeltaManager,
    IDocumentStorageService,
    IGenericBlob,
    IPlatform,
    IQuorum,
    IRequest,
    IResponse,
    ISequencedDocumentMessage,
    ISnapshotTree,
    ITreeEntry,
    MessageType,
    TreeEntry,
} from "@prague/container-definitions";
import {
    IAttachMessage,
    IChaincode,
    IChaincodeComponent,
    IChaincodeModule,
    IChannel,
    IChannelAttributes,
    IComponentDeltaHandler,
    IComponentRuntime,
    IDistributedObjectServices,
    IEnvelope,
    IObjectStorageService,
    IRuntime,
} from "@prague/runtime-definitions";
import { Deferred, gitHashFile, readAndParse } from "@prague/utils";
import * as assert from "assert";
import { EventEmitter } from "events";
// tslint:disable-next-line:no-submodule-imports no-var-requires
const cloneDeep = require("lodash/cloneDeep") as <T>(value: T) => T;
import { ChannelDeltaConnection } from "./channelDeltaConnection";
import { ChannelStorageService } from "./channelStorageService";
import { LocalChannelStorageService } from "./localChannelStorageService";

export interface IChannelState {
    object: IChannel;
    storage: IObjectStorageService;
    connection: ChannelDeltaConnection;
}

interface IObjectServices {
    deltaConnection: ChannelDeltaConnection;
    objectStorage: IObjectStorageService;
}

class ServicePlatform extends EventEmitter implements IPlatform {
    private readonly qi: Map<string, Promise<any>>;

    constructor(services?: ReadonlyArray<[string, Promise<any>]>) {
        super();
        this.qi = new Map(services);
    }

    public queryInterface<T>(id: string): Promise<T> {
        return this.qi.get(id) || Promise.reject(`queryInterface() failed - Unknown id '${id}'.`);
    }

    public detach() {
        return;
    }
}

/**
 * Base component class
 */
export class ComponentHost extends EventEmitter implements IComponentDeltaHandler, IRuntime {
    public static async LoadFromSnapshot(
        componentRuntime: IComponentRuntime,
        chaincode: IChaincode,
    ) {
        const tree = componentRuntime.baseSnapshot;
        const tardisMessagesP = ComponentHost.loadTardisMessages(
            componentRuntime.documentId,
            componentRuntime.branch,
            componentRuntime.storage,
            tree);

        const runtime = new ComponentHost(
            componentRuntime,
            componentRuntime.tenantId,
            componentRuntime.documentId,
            componentRuntime.id,
            componentRuntime.parentBranch,
            componentRuntime.existing,
            componentRuntime.options,
            componentRuntime.blobManager,
            componentRuntime.deltaManager,
            componentRuntime.getQuorum(),
            chaincode,
            componentRuntime.storage,
            componentRuntime.snapshotFn,
            componentRuntime.closeFn);

        // Must always receive the component type inside of the attributes
        const tardisMessages = await tardisMessagesP;
        if (tree && tree.trees) {
            Object.keys(tree.trees).forEach((path) => {
                // Reserve space for the channel
                runtime.reserve(path);
            });

            /* tslint:disable:promise-function-async */
            const loadSnapshotsP = Object.keys(tree.trees).map((path) => {
                return runtime.loadSnapshotChannel(
                    path,
                    tree.trees[path],
                    componentRuntime.storage,
                    tardisMessages.has(path) ? tardisMessages.get(path) : [],
                    componentRuntime.branch);
            });

            await Promise.all(loadSnapshotsP);
        }

        // Start the runtime
        await runtime.start();

        return runtime;
    }

    private static async loadTardisMessages(
        id: string,
        branch: string,
        storage: IDocumentStorageService,
        tree: ISnapshotTree): Promise<Map<string, ISequencedDocumentMessage[]>> {

        const messages: ISequencedDocumentMessage[] = tree
            ? await readAndParse<ISequencedDocumentMessage[]>(storage, tree.blobs[".messages"])
            : [];

        // Update message information based on branch details
        if (branch !== id) {
            for (const message of messages) {
                // Append branch information when transforming for the case of messages stashed with the snapshot
                if (branch) {
                    message.origin = {
                        id: branch,
                        minimumSequenceNumber: message.minimumSequenceNumber,
                        sequenceNumber: message.sequenceNumber,
                    };
                }
            }
        }

        // Make a reservation for the root object as well as all distributed objects in the snapshot
        const transformedMap = new Map<string, ISequencedDocumentMessage[]>();

        // Filter messages per distributed data type
        for (const message of messages) {
            if (message.type === MessageType.Operation) {
                const envelope = message.contents as IEnvelope;
                if (!transformedMap.has(envelope.address)) {
                    transformedMap.set(envelope.address, []);
                }

                transformedMap.get(envelope.address).push(message);
            }
        }

        return transformedMap;
    }

    public get connected(): boolean {
        return this.componentRuntime.connected;
    }

    // Interface used to access the runtime code
    public get platform(): IPlatform {
        return this._platform;
    }

    public get clientId(): string {
        return this.componentRuntime.clientId;
    }

    private channels = new Map<string, IChannelState>();
    private channelsDeferred = new Map<string, Deferred<IChannel>>();
    private closed = false;
    private pendingAttach = new Map<string, IAttachMessage>();
    private messagesSinceMSNChange = new Array<ISequencedDocumentMessage>();

    // tslint:disable-next-line:variable-name
    private _platform: IPlatform;
    // tslint:enable-next-line:variable-name

    private constructor(
        private readonly componentRuntime: IComponentRuntime,
        public readonly tenantId: string,
        public readonly documentId: string,
        public readonly id: string,
        public readonly parentBranch: string,
        public existing: boolean,
        public readonly options: any,
        private blobManager: IBlobManager,
        public readonly deltaManager: IDeltaManager,
        private quorum: IQuorum,
        private readonly chaincode: IChaincode,
        private storageService: IDocumentStorageService,
        private snapshotFn: (message: string) => Promise<void>,
        private closeFn: () => void) {
        super();
    }

    public createAndAttachComponent(id: string, pkg: string): Promise<IComponentRuntime> {
        return this.componentRuntime.createAndAttachComponent(id, pkg);
    }

    public getComponent(id: string, wait: boolean): Promise<IComponentRuntime> {
        return this.componentRuntime.getComponent(id, wait);
    }

    /**
     * Opens the component with the given 'id'.  Once the component is retrieved, it is attached
     * with the given list of services.
     */
    public async openComponent<T extends IChaincodeComponent>(
        id: string,
        wait: boolean,
        services?: ReadonlyArray<[string, Promise<any>]>,
    ): Promise<T> {
        const runtime = await this.componentRuntime.getComponent(id, wait);
        const platform = await runtime.attach(new ServicePlatform(services));
        return platform.queryInterface("component");
    }

    public async request(request: IRequest): Promise<IResponse> {
        const id = request.url.substr(1);
        const value = await this.getChannel(id);
        return { mimeType: "prague/dataType", status: 200, value };
    }

    public getChannel(id: string): Promise<IChannel> {
        this.verifyNotClosed();

        // TODO we don't assume any channels (even root) in the runtime. If you request a channel that doesn't exist
        // we will never resolve the promise. May want a flag to getChannel that doesn't wait for the promise if
        // it doesn't exist
        if (!this.channelsDeferred.has(id)) {
            this.channelsDeferred.set(id, new Deferred<IChannel>());
        }

        return this.channelsDeferred.get(id).promise;
    }

    public createChannel(id: string, type: string): IChannel {
        this.verifyNotClosed();

        const extension = this.chaincode.getModule(type) as IChaincodeModule;
        const channel = extension.create(this, id);
        this.channels.set(id, { object: channel, connection: null, storage: null });

        if (this.channelsDeferred.has(id)) {
            this.channelsDeferred.get(id).resolve(channel);
        } else {
            const deferred = new Deferred<IChannel>();
            deferred.resolve(channel);
            this.channelsDeferred.set(id, deferred);
        }

        return channel;
    }

    public attachChannel(channel: IChannel): IDistributedObjectServices {
        this.verifyNotClosed();

        // Get the object snapshot and include it in the initial attach
        const snapshot = channel.snapshot();

        const message: IAttachMessage = {
            id: channel.id,
            snapshot,
            type: channel.type,
        };
        this.pendingAttach.set(channel.id, message);
        this.submit(MessageType.Attach, message);

        // Store a reference to the object in our list of objects and then get the services
        // used to attach it to the stream
        const services = this.getObjectServices(channel.id, null, this.storageService);

        const entry = this.channels.get(channel.id);
        assert.equal(entry.object, channel);
        entry.connection = services.deltaConnection;
        entry.storage = services.objectStorage;

        return services;
    }

    public async ready(): Promise<void> {
        this.verifyNotClosed();

        await Promise.all(Array.from(this.channels.values()).map((value) => value.object.ready()));
    }

    public async start(): Promise<void> {
        this.verifyNotClosed();
        this._platform = await this.chaincode.run(this, null);
    }

    public changeConnectionState(value: ConnectionState, clientId: string) {
        this.verifyNotClosed();

        // Resend all pending attach messages prior to notifying clients
        if (value === ConnectionState.Connected) {
            for (const [, message] of this.pendingAttach) {
                this.submit(MessageType.Attach, message);
            }
        }

        for (const [, object] of this.channels) {
            if (object.connection) {
                object.connection.setConnectionState(value);
            }
        }

        if (value === ConnectionState.Connected) {
            this.emit("connected", clientId);
        }
    }

    public getQuorum(): IQuorum {
        this.verifyNotClosed();

        return this.quorum;
    }

    public snapshot(message: string): Promise<void> {
        this.verifyNotClosed();

        return this.snapshotFn(message);
    }

    public save(tag: string) {
        this.verifyNotClosed();
        this.submit(MessageType.Save, tag);
    }

    public async uploadBlob(file: IGenericBlob): Promise<IGenericBlob> {
        this.verifyNotClosed();

        const sha = gitHashFile(file.content);
        file.sha = sha;
        file.url = this.storageService.getRawUrl(sha);

        await this.blobManager.createBlob(file);
        this.submit(MessageType.BlobUploaded, await this.blobManager.createBlob(file));

        return file;
    }

    public getBlob(sha: string): Promise<IGenericBlob> {
        this.verifyNotClosed();

        return this.blobManager.getBlob(sha);
    }

    public async getBlobMetadata(): Promise<IGenericBlob[]> {
        return this.blobManager.getBlobMetadata();
    }

    public stop(): ITreeEntry[] {
        this.verifyNotClosed();

        this.closed = true;

        return this.snapshotInternal();
    }

    public close(): void {
        this.closeFn();
    }

    public async prepare(message: ISequencedDocumentMessage, local: boolean): Promise<any> {
        switch (message.type) {
            case MessageType.Attach:
                return this.prepareAttach(message, local);
            case MessageType.Operation:
                return this.prepareOp(message, local);
            default:
                return;
        }
    }

    public process(message: ISequencedDocumentMessage, local: boolean, context: any) {
        this.messagesSinceMSNChange.push(message);

        let target: IChannel = null;
        switch (message.type) {
            case MessageType.Attach:
                target = this.processAttach(message, local, context);
                break;
            case MessageType.Operation:
                target = this.processOp(message, local, context);
                break;
            default:
        }

        this.emit("op", message, target);
    }

    public updateMinSequenceNumber(msn: number) {
        let index = 0;
        for (; index < this.messagesSinceMSNChange.length; index++) {
            if (this.messagesSinceMSNChange[index].sequenceNumber > msn) {
                break;
            }
        }
        if (index !== 0) {
            this.messagesSinceMSNChange = this.messagesSinceMSNChange.slice(index);
        }

        for (const [, object] of this.channels) {
            if (!object.object.isLocal()) {
                object.connection.updateMinSequenceNumber(msn);
            }
        }
    }

    public snapshotInternal(): ITreeEntry[] {
        const entries = new Array<ITreeEntry>();

        this.updateMinSequenceNumber(this.deltaManager.minimumSequenceNumber);

        // debug(`Transforming up to ${this.deltaManager.minimumSequenceNumber}`);
        const transformedMessages: ISequencedDocumentMessage[] = [];
        for (const message of this.messagesSinceMSNChange) {
            transformedMessages.push(this.transform(message, this.deltaManager.minimumSequenceNumber));
        }

        entries.push({
            mode: FileMode.File,
            path: ".messages",
            type: TreeEntry[TreeEntry.Blob],
            value: {
                contents: JSON.stringify(transformedMessages),
                encoding: "utf-8",
            },
        });

        // Craft the .attributes file for each distributed object
        for (const [objectId, object] of this.channels) {
            // If the object isn't local - and we have received the sequenced op creating the object (i.e. it has a
            // base mapping) - then we go ahead and snapshot
            if (!object.object.isLocal()) {
                const snapshot = object.object.snapshot();

                // Add in the object attributes to the returned tree
                const objectAttributes: IChannelAttributes = {
                    type: object.object.type,
                };
                snapshot.entries.push({
                    mode: FileMode.File,
                    path: ".attributes",
                    type: TreeEntry[TreeEntry.Blob],
                    value: {
                        contents: JSON.stringify(objectAttributes),
                        encoding: "utf-8",
                    },
                });

                // And then store the tree
                entries.push({
                    mode: FileMode.Directory,
                    path: objectId,
                    type: TreeEntry[TreeEntry.Tree],
                    value: snapshot,
                });
            }
        }

        return entries;
    }

    public submitMessage(type: MessageType, content: any) {
        this.submit(type, content);
    }

    private transform(originalMessage: ISequencedDocumentMessage, sequenceNumber: number): ISequencedDocumentMessage {
        // Make a copy of original message since we will be modifying in place
        const message = cloneDeep(originalMessage) as ISequencedDocumentMessage;

        // Allow the distributed data types to perform custom transformations
        if (message.type === MessageType.Operation) {
            if (message.referenceSequenceNumber < sequenceNumber) {
                const envelope = message.contents as IEnvelope;
                const objectDetails = this.channels.get(envelope.address);
                envelope.contents = objectDetails.object.transform(
                    envelope.contents,
                    message.referenceSequenceNumber,
                    sequenceNumber);
            }
        } else {
            message.type = MessageType.NoOp;
            message.referenceSequenceNumber = sequenceNumber;
            delete message.contents;
        }

        return message;
    }

    private submit(type: MessageType, content: any): number {
        this.verifyNotClosed();
        return this.componentRuntime.submitMessage(type, content);
    }

    private reserve(id: string) {
        if (!this.channelsDeferred.has(id)) {
            this.channelsDeferred.set(id, new Deferred<IChannel>());
        }
    }

    private prepareOp(message: ISequencedDocumentMessage, local: boolean) {
        this.verifyNotClosed();

        const envelope = message.contents as IEnvelope;
        const objectDetails = this.channels.get(envelope.address);
        assert(objectDetails);

        const transformed: ISequencedDocumentMessage = {
            clientId: message.clientId,
            clientSequenceNumber: message.clientSequenceNumber,
            contents: envelope.contents,
            metadata: message.metadata,
            minimumSequenceNumber: message.minimumSequenceNumber,
            origin: message.origin,
            referenceSequenceNumber: message.referenceSequenceNumber,
            sequenceNumber: message.sequenceNumber,
            timestamp: message.timestamp,
            traces: message.traces,
            type: message.type,
        };

        return objectDetails.connection.prepare(transformed, local);
    }

    private processOp(message: ISequencedDocumentMessage, local: boolean, context: any): IChannel {
        this.verifyNotClosed();

        const envelope = message.contents as IEnvelope;
        const objectDetails = this.channels.get(envelope.address);
        assert(objectDetails);

        const transformed: ISequencedDocumentMessage = {
            clientId: message.clientId,
            clientSequenceNumber: message.clientSequenceNumber,
            contents: envelope.contents,
            metadata: message.metadata,
            minimumSequenceNumber: message.minimumSequenceNumber,
            origin: message.origin,
            referenceSequenceNumber: message.referenceSequenceNumber,
            sequenceNumber: message.sequenceNumber,
            timestamp: message.timestamp,
            traces: message.traces,
            type: message.type,
        };
        objectDetails.connection.process(transformed, local, context);

        return objectDetails.object;
    }

    private processAttach(message: ISequencedDocumentMessage, local: boolean, context: any): IChannel {
        this.verifyNotClosed();

        const attachMessage = message.contents as IAttachMessage;

        // If a non-local operation then go and create the object - otherwise mark it as officially attached.
        if (local) {
            assert(this.pendingAttach.has(attachMessage.id));
            this.pendingAttach.delete(attachMessage.id);
        } else {
            const channelState = context as IChannelState;
            this.channels.set(channelState.object.id, channelState);
            if (this.channelsDeferred.has(channelState.object.id)) {
                this.channelsDeferred.get(channelState.object.id).resolve(channelState.object);
            } else {
                const deferred = new Deferred<IChannel>();
                deferred.resolve(channelState.object);
                this.channelsDeferred.set(channelState.object.id, deferred);
            }
        }

        return this.channels.get(attachMessage.id).object;
    }

    private async prepareAttach(message: ISequencedDocumentMessage, local: boolean): Promise<IChannelState> {
        this.verifyNotClosed();

        if (local) {
            return;
        }

        const attachMessage = message.contents as IAttachMessage;

        // create storage service that wraps the attach data
        const localStorage = new LocalChannelStorageService(attachMessage.snapshot);
        const connection = new ChannelDeltaConnection(
            attachMessage.id,
            this.componentRuntime.connectionState,
            (submitMessage) => {
                const submitEnvelope: IEnvelope = {
                    address: attachMessage.id,
                    contents: submitMessage,
                };
                return this.submit(MessageType.Operation, submitEnvelope);
            });

        const services: IObjectServices = {
            deltaConnection: connection,
            objectStorage: localStorage,
        };

        const origin = message.origin ? message.origin.id : this.id;
        const value = await this.loadChannel(
            attachMessage.id,
            attachMessage.type,
            message.minimumSequenceNumber,
            [],
            services,
            origin);

        return value;
    }

    private async loadSnapshotChannel(
        id: string,
        tree: ISnapshotTree,
        storage: IDocumentStorageService,
        messages: ISequencedDocumentMessage[],
        branch: string): Promise<void> {

        const channelAttributes = await readAndParse<IChannelAttributes>(storage, tree.blobs[".attributes"]);
        const services = this.getObjectServices(id, tree, storage);

        const channelDetails = await this.loadChannel(
            id,
            channelAttributes.type,
            this.deltaManager.minimumSequenceNumber,
            messages,
            services,
            branch);

        assert(!this.channels.has(id));
        this.channels.set(id, channelDetails);
        this.channelsDeferred.get(id).resolve(channelDetails.object);
    }

    private async loadChannel(
        id: string,
        type: string,
        minSequenceNumber: number,
        messages: ISequencedDocumentMessage[],
        services: IObjectServices,
        originBranch: string): Promise<IChannelState> {

        // Pass the transformedMessages - but the object really should be storing this
        const extension = this.chaincode.getModule(type) as IChaincodeModule;

        // TODO need to fix up the SN vs. MSN stuff here. If want to push messages to object also need
        // to store the mappings from channel ID to doc ID.
        const value = await extension.load(
            this,
            id,
            minSequenceNumber,
            messages,
            services,
            originBranch);

        return { object: value, storage: services.objectStorage, connection: services.deltaConnection };
    }

    private getObjectServices(
        id: string,
        tree: ISnapshotTree,
        storage: IDocumentStorageService): IObjectServices {

        const deltaConnection = new ChannelDeltaConnection(
            id,
            this.componentRuntime.connectionState,
            (message) => {
                const envelope: IEnvelope = { address: id, contents: message };
                return this.submit(MessageType.Operation, envelope);
            });
        const objectStorage = new ChannelStorageService(tree, storage);

        return {
            deltaConnection,
            objectStorage,
        };
    }

    private verifyNotClosed() {
        if (this.closed) {
            throw new Error("Runtime is closed");
        }
    }
}
