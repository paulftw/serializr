import { invariant, isModelSchema, processAdditionalPropArgs } from "../utils/utils";
import getDefaultModelSchema from "../api/getDefaultModelSchema";
import serialize from "../core/serialize";
import { deserializeObjectWithSchema } from "../core/deserialize";
import { ClazzOrModelSchema, AdditionalPropArgs, PropSchema } from "../api/types";

/**
 * `object` indicates that this property contains an object that needs to be (de)serialized
 * using its own model schema.
 *
 * N.B. mind issues with circular dependencies when importing model schema's from other files! The module resolve algorithm might expose classes before `createModelSchema` is executed for the target class.
 *
 * @example
 * class SubTask {}
 * class Todo {}
 *
 * createModelSchema(SubTask, {
 *     title: true,
 * })
 * createModelSchema(Todo, {
 *     title: true,
 *     subTask: object(SubTask),
 * })
 *
 * const todo = deserialize(Todo, {
 *     title: 'Task',
 *     subTask: {
 *         title: 'Sub task',
 *     },
 * })
 *
 * @param modelSchema to be used to (de)serialize the object
 * @param additionalArgs optional object that contains beforeDeserialize and/or afterDeserialize handlers
 */
export default function object(
    modelSchema: ClazzOrModelSchema<any>,
    additionalArgs?: AdditionalPropArgs
): PropSchema {
    invariant(
        typeof modelSchema === "object" || typeof modelSchema === "function",
        "No modelschema provided. If you are importing it from another file be aware of circular dependencies."
    );
    const result: PropSchema = {
        serializer: function (item) {
            const actualSchema = getDefaultModelSchema(item) || getDefaultModelSchema(modelSchema)!;
            invariant(isModelSchema(actualSchema), `expected modelSchema, got ${actualSchema}`);
            if (item === null || item === undefined) return item;
            return serialize(actualSchema, item);
        },
        deserializer: function (childJson, done, context) {
            modelSchema = getDefaultModelSchema(modelSchema)!;
            invariant(isModelSchema(modelSchema), `expected modelSchema, got ${modelSchema}`);
            if (childJson === null || childJson === undefined) return void done(null, childJson);
            return void deserializeObjectWithSchema(
                context,
                modelSchema,
                childJson,
                done,
                undefined
            );
        },
    };
    return processAdditionalPropArgs(result, additionalArgs);
}
