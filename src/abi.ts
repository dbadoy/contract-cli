export type ABIType =
  | "address"
  | "bool"
  | "string"
  | "bytes"
  | `uint${8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80 | 88 | 96 | 104 | 112 | 120 | 128 | 136 | 144 | 152 | 160 | 168 | 176 | 184 | 192 | 200 | 208 | 216 | 224 | 232 | 240 | 248 | 256}`
  | `int${8 | 16 | 24 | 32 | 40 | 48 | 56 | 64 | 72 | 80 | 88 | 96 | 104 | 112 | 120 | 128 | 136 | 144 | 152 | 160 | 168 | 176 | 184 | 192 | 200 | 208 | 216 | 224 | 232 | 240 | 248 | 256}`
  | `bytes${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25 | 26 | 27 | 28 | 29 | 30 | 31 | 32}`;

export type ABIArrayType = `${ABIType}[]` | `${ABIType}[${number}]`;

export interface ABITupleType {
  type: "tuple";
  components: ABIParameter[];
}

export interface ABITupleArrayType {
  type: "tuple[]" | `tuple[${number}]`;
  components: ABIParameter[];
}

export interface ABIParameter {
  name?: string;
  type: ABIType | ABIArrayType | "tuple" | "tuple[]" | `tuple[${number}]`;
  components?: ABIParameter[];
  indexed?: boolean;
  internalType?: string;
}

export interface ABIFunction {
  type: "function";
  name: string;
  inputs: ABIParameter[];
  outputs: ABIParameter[];
  stateMutability: "pure" | "view" | "nonpayable" | "payable";
  constant?: boolean;
  payable?: boolean;
}

export interface ABIEvent {
  type: "event";
  name: string;
  inputs: ABIParameter[];
  anonymous?: boolean;
}

export interface ABIConstructor {
  type: "constructor";
  inputs: ABIParameter[];
  stateMutability?: "payable" | "nonpayable";
  payable?: boolean;
}

export interface ABIFallback {
  type: "fallback";
  stateMutability: "payable" | "nonpayable";
  payable?: boolean;
}

export interface ABIReceive {
  type: "receive";
  stateMutability: "payable";
}

export interface ABIError {
  type: "error";
  name: string;
  inputs: ABIParameter[];
}

export type ABIDefinition =
  | ABIFunction
  | ABIEvent
  | ABIConstructor
  | ABIFallback
  | ABIReceive
  | ABIError;

export type ContractABI = ABIDefinition[];

export interface ABIFunctionSignature {
  name: string;
  inputs: ABIParameter[];
  signature: string;
  selector: string;
}
