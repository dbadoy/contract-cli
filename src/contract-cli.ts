import ethers, {
  ContractTransactionResponse,
  Result as ViewResult,
} from "ethers";
import prompts, { Choice } from "prompts";
import { ContractABI, ABIFunction, ABIParameter } from "./abi";

export interface Result {
  result: ViewResult | ContractTransactionResponse;
  outputs: ABIParameter[];
}

export class ContractCLI {
  constructor(private readonly abi: ContractABI) {}

  async run(contract: ethers.Contract): Promise<Result> {
    const sendable = contract.runner?.sendTransaction !== undefined;

    const res = await prompts([
      {
        type: "select",
        name: "abiFunction",
        choices: await this.generateSelections(!sendable),
        message: sendable ? "" : "read-only",
        initial: 0,
      },
    ]);

    const abiFunction: ABIFunction = res.abiFunction;

    const [params, value, blockTag] = await Promise.all([
      this.inputParameters(abiFunction),
      this.inputMsgValue(abiFunction),
      this.inputBlockTag(abiFunction),
    ]);

    const options = {
      value,
      ...(blockTag !== undefined && { blockTag }),
    };

    return {
      result: await contract[abiFunction.name](
        ...(params.length > 0 ? [...params, options] : [options]),
      ),
      outputs: abiFunction.outputs,
    };
  }

  private async generateSelections(
    onlyViewFunctions: boolean,
  ): Promise<Choice[]> {
    const selections: Choice[] = [];
    for await (const definition of this.abi) {
      if (definition.type !== "function") continue;
      if (onlyViewFunctions) {
        if (
          definition.stateMutability === "view" ||
          definition.stateMutability === "pure"
        ) {
          selections.push({
            title: definition.name,
            description: JSON.stringify(definition.inputs),
            value: definition,
          });
        }
      } else {
        selections.push({
          title: definition.name,
          description: JSON.stringify(definition.inputs),
          value: definition,
        });
      }
    }
    return selections;
  }

  private async inputParameters(abiFunction: ABIFunction): Promise<string[]> {
    let result: string[] = [];

    for await (const input of abiFunction.inputs) {
      const insert = await prompts([
        {
          type: "text",
          name: "value",
          message: `${input.name} (${input.type})`,
        },
      ]);
      result.push(insert.value);
    }
    return result;
  }

  private async inputBlockTag(
    abiFunction: ABIFunction,
  ): Promise<number | undefined> {
    let blockTag: number | undefined;

    if (
      abiFunction.stateMutability === "view" ||
      abiFunction.stateMutability === "pure"
    ) {
      const r = await prompts({
        type: "number",
        name: "blockTag",
        message: "blockTag (default: latest)",
        initial: undefined,
      });
      if (r.blockTag !== "") blockTag = r.blockTag;
    }

    return blockTag;
  }

  private async inputMsgValue(abiFunction: ABIFunction): Promise<bigint> {
    let msgValue: bigint = BigInt(0);

    if (abiFunction.stateMutability === "payable") {
      const r = await prompts({
        type: "number",
        name: "value",
        message: "msg.value (default: 0)",
        initial: 0,
      });
      msgValue = BigInt(r.value);
    }

    return msgValue;
  }
}
