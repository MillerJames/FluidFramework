/*!
 * Copyright (c) Microsoft Corporation and contributors. All rights reserved.
 * Licensed under the MIT License.
 */
/*
 * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
 * Generated by fluid-type-validator in @fluidframework/build-tools.
 */
/* eslint-disable max-lines */
import * as old from "@fluidframework/tinylicious-client-previous";
import * as current from "../../index";

type TypeOnly<T> = {
    [P in keyof T]: TypeOnly<T[P]>;
};

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_ITelemetryBaseEvent": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ITelemetryBaseEvent():
    TypeOnly<old.ITelemetryBaseEvent>;
declare function use_current_InterfaceDeclaration_ITelemetryBaseEvent(
    use: TypeOnly<current.ITelemetryBaseEvent>);
use_current_InterfaceDeclaration_ITelemetryBaseEvent(
    get_old_InterfaceDeclaration_ITelemetryBaseEvent());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_ITelemetryBaseEvent": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ITelemetryBaseEvent():
    TypeOnly<current.ITelemetryBaseEvent>;
declare function use_old_InterfaceDeclaration_ITelemetryBaseEvent(
    use: TypeOnly<old.ITelemetryBaseEvent>);
use_old_InterfaceDeclaration_ITelemetryBaseEvent(
    get_current_InterfaceDeclaration_ITelemetryBaseEvent());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_ITelemetryBaseLogger": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_ITelemetryBaseLogger():
    TypeOnly<old.ITelemetryBaseLogger>;
declare function use_current_InterfaceDeclaration_ITelemetryBaseLogger(
    use: TypeOnly<current.ITelemetryBaseLogger>);
use_current_InterfaceDeclaration_ITelemetryBaseLogger(
    get_old_InterfaceDeclaration_ITelemetryBaseLogger());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_ITelemetryBaseLogger": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_ITelemetryBaseLogger():
    TypeOnly<current.ITelemetryBaseLogger>;
declare function use_old_InterfaceDeclaration_ITelemetryBaseLogger(
    use: TypeOnly<old.ITelemetryBaseLogger>);
use_old_InterfaceDeclaration_ITelemetryBaseLogger(
    get_current_InterfaceDeclaration_ITelemetryBaseLogger());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "TypeAliasDeclaration_ITinyliciousAudience": {"forwardCompat": false}
*/
declare function get_old_TypeAliasDeclaration_ITinyliciousAudience():
    TypeOnly<old.ITinyliciousAudience>;
declare function use_current_TypeAliasDeclaration_ITinyliciousAudience(
    use: TypeOnly<current.ITinyliciousAudience>);
use_current_TypeAliasDeclaration_ITinyliciousAudience(
    get_old_TypeAliasDeclaration_ITinyliciousAudience());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "TypeAliasDeclaration_ITinyliciousAudience": {"backCompat": false}
*/
declare function get_current_TypeAliasDeclaration_ITinyliciousAudience():
    TypeOnly<current.ITinyliciousAudience>;
declare function use_old_TypeAliasDeclaration_ITinyliciousAudience(
    use: TypeOnly<old.ITinyliciousAudience>);
use_old_TypeAliasDeclaration_ITinyliciousAudience(
    get_current_TypeAliasDeclaration_ITinyliciousAudience());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "ClassDeclaration_TinyliciousAudience": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_TinyliciousAudience():
    TypeOnly<old.TinyliciousAudience>;
declare function use_current_ClassDeclaration_TinyliciousAudience(
    use: TypeOnly<current.TinyliciousAudience>);
use_current_ClassDeclaration_TinyliciousAudience(
    get_old_ClassDeclaration_TinyliciousAudience());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "ClassDeclaration_TinyliciousAudience": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_TinyliciousAudience():
    TypeOnly<current.TinyliciousAudience>;
declare function use_old_ClassDeclaration_TinyliciousAudience(
    use: TypeOnly<old.TinyliciousAudience>);
use_old_ClassDeclaration_TinyliciousAudience(
    get_current_ClassDeclaration_TinyliciousAudience());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "ClassDeclaration_TinyliciousClient": {"forwardCompat": false}
*/
declare function get_old_ClassDeclaration_TinyliciousClient():
    TypeOnly<old.TinyliciousClient>;
declare function use_current_ClassDeclaration_TinyliciousClient(
    use: TypeOnly<current.TinyliciousClient>);
use_current_ClassDeclaration_TinyliciousClient(
    get_old_ClassDeclaration_TinyliciousClient());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "ClassDeclaration_TinyliciousClient": {"backCompat": false}
*/
declare function get_current_ClassDeclaration_TinyliciousClient():
    TypeOnly<current.TinyliciousClient>;
declare function use_old_ClassDeclaration_TinyliciousClient(
    use: TypeOnly<old.TinyliciousClient>);
use_old_ClassDeclaration_TinyliciousClient(
    get_current_ClassDeclaration_TinyliciousClient());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousClientProps": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_TinyliciousClientProps():
    TypeOnly<old.TinyliciousClientProps>;
declare function use_current_InterfaceDeclaration_TinyliciousClientProps(
    use: TypeOnly<current.TinyliciousClientProps>);
use_current_InterfaceDeclaration_TinyliciousClientProps(
    get_old_InterfaceDeclaration_TinyliciousClientProps());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousClientProps": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_TinyliciousClientProps():
    TypeOnly<current.TinyliciousClientProps>;
declare function use_old_InterfaceDeclaration_TinyliciousClientProps(
    use: TypeOnly<old.TinyliciousClientProps>);
use_old_InterfaceDeclaration_TinyliciousClientProps(
    get_current_InterfaceDeclaration_TinyliciousClientProps());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousConnectionConfig": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_TinyliciousConnectionConfig():
    TypeOnly<old.TinyliciousConnectionConfig>;
declare function use_current_InterfaceDeclaration_TinyliciousConnectionConfig(
    use: TypeOnly<current.TinyliciousConnectionConfig>);
use_current_InterfaceDeclaration_TinyliciousConnectionConfig(
    get_old_InterfaceDeclaration_TinyliciousConnectionConfig());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousConnectionConfig": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_TinyliciousConnectionConfig():
    TypeOnly<current.TinyliciousConnectionConfig>;
declare function use_old_InterfaceDeclaration_TinyliciousConnectionConfig(
    use: TypeOnly<old.TinyliciousConnectionConfig>);
use_old_InterfaceDeclaration_TinyliciousConnectionConfig(
    get_current_InterfaceDeclaration_TinyliciousConnectionConfig());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousContainerServices": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_TinyliciousContainerServices():
    TypeOnly<old.TinyliciousContainerServices>;
declare function use_current_InterfaceDeclaration_TinyliciousContainerServices(
    use: TypeOnly<current.TinyliciousContainerServices>);
use_current_InterfaceDeclaration_TinyliciousContainerServices(
    get_old_InterfaceDeclaration_TinyliciousContainerServices());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousContainerServices": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_TinyliciousContainerServices():
    TypeOnly<current.TinyliciousContainerServices>;
declare function use_old_InterfaceDeclaration_TinyliciousContainerServices(
    use: TypeOnly<old.TinyliciousContainerServices>);
use_old_InterfaceDeclaration_TinyliciousContainerServices(
    get_current_InterfaceDeclaration_TinyliciousContainerServices());

/*
* Validate forward compat by using old type in place of current type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousMember": {"forwardCompat": false}
*/
declare function get_old_InterfaceDeclaration_TinyliciousMember():
    TypeOnly<old.TinyliciousMember>;
declare function use_current_InterfaceDeclaration_TinyliciousMember(
    use: TypeOnly<current.TinyliciousMember>);
use_current_InterfaceDeclaration_TinyliciousMember(
    get_old_InterfaceDeclaration_TinyliciousMember());

/*
* Validate back compat by using current type in place of old type
* If breaking change required, add in package.json under typeValidation.broken.0.58.2000:
* "InterfaceDeclaration_TinyliciousMember": {"backCompat": false}
*/
declare function get_current_InterfaceDeclaration_TinyliciousMember():
    TypeOnly<current.TinyliciousMember>;
declare function use_old_InterfaceDeclaration_TinyliciousMember(
    use: TypeOnly<old.TinyliciousMember>);
use_old_InterfaceDeclaration_TinyliciousMember(
    get_current_InterfaceDeclaration_TinyliciousMember());
