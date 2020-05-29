import { ExpressionEvaluator } from './expressionEvaluator';
import { ExpressionType } from './expressionType';
import { ExpressionFunctions } from './expressionFunctions';
import { ReturnType, Expression } from './expression';
import * as os from 'os';

export class ExpressionFunctionsForNode {
    public static _initialize(): void {
        this.injectedFunctions();
    }
    private static injectedFunctions(): void {
        const functions: ExpressionEvaluator[] = [
            new ExpressionEvaluator(
                ExpressionType.EOL,
                ExpressionFunctions.apply((): string => os.EOL),
                ReturnType.String,
                (expression: Expression): void => ExpressionFunctions.validateArityAndAnyType(expression, 0, 0)
            ),
        ];

        functions.forEach((func: ExpressionEvaluator): void => {
            Expression.functions.add(func.type, func);
        });

    }
}

ExpressionFunctionsForNode._initialize();