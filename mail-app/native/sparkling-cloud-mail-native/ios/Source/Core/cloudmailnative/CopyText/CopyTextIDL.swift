// Copyright 2025 The Sparkling Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import Foundation
import SparklingMethod

// Auto-generated temporary model types
// Parameter model
@objc(SPKCopyTextMethodParamModel)
public class SPKCopyTextMethodParamModel: SPKMethodModel {
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
@objc(SPKCopyTextMethodResultModel)
public class SPKCopyTextMethodResultModel: SPKMethodModel {
    @objc public var : 

    @objc public override class func jsonKeyPathsByPropertyKey() -> [AnyHashable: Any] {
        return {
            "": "",
        }()
    }
}

// Main method class
@objc(SPKCopyTextMethod)
public class SPKCopyTextMethod: PipeMethod {
    @objc public override var paramsModelClass: AnyClass {
        return SPKCopyTextMethodParamModel.self
    }

    @objc public override var resultModelClass: AnyClass {
        return SPKCopyTextMethodResultModel.self
    }

    public override var methodName: String {
        return "CloudMailNative.copyText"
    }

    public override class func methodName() -> String {
        return "CloudMailNative.copyText"
    }
}
