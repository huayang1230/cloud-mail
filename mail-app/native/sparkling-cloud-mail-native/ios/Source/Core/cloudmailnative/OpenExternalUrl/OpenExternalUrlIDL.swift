// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Foundation
import SparklingMethod

// Auto-generated temporary model types
// Parameter model
@objc(SPKOpenExternalUrlMethodParamModel)
public class SPKOpenExternalUrlMethodParamModel: SPKMethodModel {
    @objc public var : 

    @objc public override class func requiredKeyPaths() -> Set<String>? {
        return nil
    }

    @objc public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return {
            "": "",
        }()
    }
}

// Result model
@objc(SPKOpenExternalUrlMethodResultModel)
public class SPKOpenExternalUrlMethodResultModel: SPKMethodModel {
    @objc public var : 

    @objc public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return {
            "": "",
        }()
    }
}

// Main method class
@objc(SPKOpenExternalUrlMethod)
public class SPKOpenExternalUrlMethod: PipeMethod {
    @objc public override var paramsModelClass: AnyClass {
        return SPKOpenExternalUrlMethodParamModel.self
    }

    @objc public override var resultModelClass: AnyClass {
        return SPKOpenExternalUrlMethodResultModel.self
    }

    public override var methodName: String {
        return "CloudMailNative.openExternalUrl"
    }

    public override class func methodName() -> String {
        return "CloudMailNative.openExternalUrl"
    }
}
