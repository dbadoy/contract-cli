import { ContractABI } from "./abi";

function isValidABIType(type: string): boolean {
  if (["address", "bool", "string", "bytes"].includes(type)) {
    return true;
  }

  if (type.startsWith("uint")) {
    const bits = parseInt(type.slice(4));
    return bits >= 8 && bits <= 256 && bits % 8 === 0;
  }

  if (type.startsWith("int") && !type.startsWith("uint")) {
    const bits = parseInt(type.slice(3));
    return bits >= 8 && bits <= 256 && bits % 8 === 0;
  }

  if (type.startsWith("bytes") && type !== "bytes") {
    const size = parseInt(type.slice(5));
    return size >= 1 && size <= 32;
  }

  return false;
}

function isValidArrayType(type: string): boolean {
  if (type.endsWith("[]")) {
    return isValidABIType(type.slice(0, -2));
  }

  const match = type.match(/^(.+)\[(\d+)\]$/);
  if (match) {
    const baseType = match[1];
    return isValidABIType(baseType);
  }

  return false;
}

function isValidABIParameter(param: any): boolean {
  if (typeof param !== "object" || param === null) return false;

  // name is optional, but if present, it must be a string
  if ("name" in param && typeof param.name !== "string") return false;

  if (typeof param.type !== "string") return false;

  if (
    param.type === "tuple" ||
    param.type === "tuple[]" ||
    param.type.startsWith("tuple[")
  ) {
    if (!Array.isArray(param.components)) return false;
    return param.components.every((component: any) =>
      isValidABIParameter(component),
    );
  }

  if (!isValidABIType(param.type) && !isValidArrayType(param.type))
    return false;

  if ("indexed" in param && typeof param.indexed !== "boolean") return false;

  return true;
}

function isValidABIFunction(func: any): boolean {
  if (typeof func !== "object" || func === null) return false;
  if (func.type !== "function") return false;
  if (typeof func.name !== "string") return false;

  if (!Array.isArray(func.inputs)) return false;
  if (!func.inputs.every((input: any) => isValidABIParameter(input)))
    return false;

  if (!Array.isArray(func.outputs)) return false;
  if (!func.outputs.every((output: any) => isValidABIParameter(output)))
    return false;

  const validStates = ["pure", "view", "nonpayable", "payable"];
  if (!validStates.includes(func.stateMutability)) return false;

  return true;
}

function isValidABIEvent(event: any): boolean {
  if (typeof event !== "object" || event === null) return false;
  if (event.type !== "event") return false;
  if (typeof event.name !== "string") return false;

  if (!Array.isArray(event.inputs)) return false;
  if (!event.inputs.every((input: any) => isValidABIParameter(input)))
    return false;

  // anonymous is optional, but if present, it must be a booleans
  if ("anonymous" in event && typeof event.anonymous !== "boolean")
    return false;

  return true;
}

function isValidABIConstructor(constructor: any): boolean {
  if (typeof constructor !== "object" || constructor === null) return false;
  if (constructor.type !== "constructor") return false;

  if (!Array.isArray(constructor.inputs)) return false;
  if (!constructor.inputs.every((input: any) => isValidABIParameter(input)))
    return false;

  if ("stateMutability" in constructor) {
    if (!["payable", "nonpayable"].includes(constructor.stateMutability))
      return false;
  }

  return true;
}

function isValidABIFallback(fallback: any): boolean {
  if (typeof fallback !== "object" || fallback === null) return false;
  if (fallback.type !== "fallback") return false;

  if (!["payable", "nonpayable"].includes(fallback.stateMutability))
    return false;

  return true;
}

function isValidABIReceive(receive: any): boolean {
  if (typeof receive !== "object" || receive === null) return false;
  if (receive.type !== "receive") return false;

  if (receive.stateMutability !== "payable") return false;

  return true;
}

function isValidABIError(error: any): boolean {
  if (typeof error !== "object" || error === null) return false;
  if (error.type !== "error") return false;
  if (typeof error.name !== "string") return false;

  if (!Array.isArray(error.inputs)) return false;
  if (!error.inputs.every((input: any) => isValidABIParameter(input)))
    return false;

  return true;
}

function isValidABIDefinition(def: any): boolean {
  if (typeof def !== "object" || def === null) return false;

  switch (def.type) {
    case "function":
      return isValidABIFunction(def);
    case "event":
      return isValidABIEvent(def);
    case "constructor":
      return isValidABIConstructor(def);
    case "fallback":
      return isValidABIFallback(def);
    case "receive":
      return isValidABIReceive(def);
    case "error":
      return isValidABIError(def);
    default:
      return false;
  }
}

export function validateContractABI(abi: any): {
  valid: boolean;
  error?: string;
} {
  if (!Array.isArray(abi)) {
    return { valid: false, error: "ABI must be an array" };
  }

  if (abi.length === 0) {
    return { valid: true };
  }

  for (let i = 0; i < abi.length; i++) {
    if (!isValidABIDefinition(abi[i])) {
      return {
        valid: false,
        error: `Invalid ABI definition at index ${i}: ${JSON.stringify(abi[i])}`,
      };
    }
  }

  return { valid: true };
}

export function parseContractABI(input: any): ContractABI {
  const result = validateContractABI(input);

  if (!result.valid) {
    throw new Error(result.error);
  }

  return input as ContractABI;
}

export function safeParseContractABI(input: any): ContractABI | null {
  try {
    return parseContractABI(input);
  } catch (error) {
    return null;
  }
}

export function isContractABI(obj: any): obj is ContractABI {
  return validateContractABI(obj).valid;
}
