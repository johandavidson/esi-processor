import { createCommentNode, DomElement, getChildNodes, isTagNode } from '../common/dom';
import { Process } from './process';
import { EsiProcessorOptions } from '../common/types';
import { Request } from 'express';
import { ParseVars } from '../common/parseVars';

export const ProcessEsiChoose = async (chooseElement: DomElement, options?: EsiProcessorOptions, req?: Request): Promise<DomElement[]> => {
    if (options && options.IgnoreEsiChooseTags) {
        return [createCommentNode('esi:choose')];
    }

    const contentElement = findMatchingChooseChild(getChildNodes(chooseElement), req);
    if (!contentElement) {
        return [createCommentNode('esi:choose without match')];
    }

    return await Process(options, req, ...getChildNodes(contentElement));
};

const findMatchingChooseChild = (children: DomElement[], req?: Request): DomElement | undefined => {
    return children.find((element) => resolveWhenContent(ParseVars(element, req)) !== undefined) ||
        children.find((element) => isTagNode(element) && element.name === 'esi:otherwise');
};

const resolveWhenContent = (whenElement: DomElement): DomElement[] | undefined => {
    if (!isTagNode(whenElement)) {
        return undefined;
    }

    const testExpression = whenElement.attribs ? whenElement.attribs.test : undefined;
    if (!testExpression) {
        return undefined;
    }

    return evaluateExpression(testExpression) ? getChildNodes(whenElement) : undefined;
};

const evaluateExpression = (expression: string): boolean => {
    const trimmed = unwrapOuterParentheses(expression.trim());
    if (!trimmed) {
        return false;
    }

    const orSegments = splitByOperator(trimmed, '||');
    if (orSegments.length > 1) {
        return orSegments.some((segment) => evaluateExpression(segment));
    }

    const andSegments = splitByOperator(trimmed, '&&');
    if (andSegments.length > 1) {
        return andSegments.every((segment) => evaluateExpression(segment));
    }

    if (trimmed[0] === '!') {
        return !evaluateExpression(trimmed.slice(1));
    }

    return evaluateComparison(trimmed);
};

const evaluateComparison = (expression: string): boolean => {
    const comparators = ['===', '!==', '==', '!=', '>=', '<=', '>', '<'];

    for (const comparator of comparators) {
        const parts = splitByOperator(expression, comparator);
        if (parts.length === 2) {
            const left = parseLiteral(parts[0]);
            const right = parseLiteral(parts[1]);
            if (left === undefined || right === undefined) {
                return false;
            }

            switch (comparator) {
                case '===':
                    return left === right;
                case '!==':
                    return left !== right;
                case '==':
                    return left == right; // tslint:disable-line:triple-equals
                case '!=':
                    return left != right; // tslint:disable-line:triple-equals
                case '>':
                    return left > right;
                case '>=':
                    return left >= right;
                case '<':
                    return left < right;
                case '<=':
                    return left <= right;
            }
        }
    }

    const value = parseLiteral(expression);
    return value !== undefined ? Boolean(value) : false;
};

const splitByOperator = (expression: string, operator: string): string[] => {
    const parts: string[] = [];
    let currentPart = '';
    let quoteCharacter = '';
    let parenthesisDepth = 0;

    for (let i = 0; i < expression.length; i++) {
        const currentCharacter = expression[i];
        const isQuoted = quoteCharacter !== '';
        if (!isQuoted && (currentCharacter === '\'' || currentCharacter === '"')) {
            quoteCharacter = currentCharacter;
            currentPart += currentCharacter;
            continue;
        }
        if (isQuoted && currentCharacter === quoteCharacter) {
            quoteCharacter = '';
            currentPart += currentCharacter;
            continue;
        }
        if (!isQuoted && currentCharacter === '(') {
            parenthesisDepth++;
            currentPart += currentCharacter;
            continue;
        }
        if (!isQuoted && currentCharacter === ')' && parenthesisDepth > 0) {
            parenthesisDepth--;
            currentPart += currentCharacter;
            continue;
        }

        if (!isQuoted && parenthesisDepth === 0 && expression.slice(i, i + operator.length) === operator) {
            parts.push(currentPart.trim());
            currentPart = '';
            i += operator.length - 1;
            continue;
        }

        currentPart += currentCharacter;
    }

    parts.push(currentPart.trim());
    return parts;
};

const parseLiteral = (value: string): string | number | boolean | undefined => {
    const trimmedValue = unwrapOuterParentheses(value.trim());
    if (!trimmedValue) {
        return undefined;
    }

    if ((trimmedValue[0] === '\'' && trimmedValue[trimmedValue.length - 1] === '\'') ||
        (trimmedValue[0] === '"' && trimmedValue[trimmedValue.length - 1] === '"')) {
        return trimmedValue.slice(1, -1);
    }

    if (trimmedValue === 'true') {
        return true;
    }
    if (trimmedValue === 'false') {
        return false;
    }

    const numberValue = Number(trimmedValue);
    if (!isNaN(numberValue)) {
        return numberValue;
    }

    return undefined;
};

const unwrapOuterParentheses = (expression: string): string => {
    let normalizedExpression = expression;
    while (normalizedExpression[0] === '(' && normalizedExpression[normalizedExpression.length - 1] === ')' &&
        hasBalancedOuterParentheses(normalizedExpression)) {
        normalizedExpression = normalizedExpression.slice(1, -1).trim();
    }
    return normalizedExpression;
};

const hasBalancedOuterParentheses = (expression: string): boolean => {
    let quoteCharacter = '';
    let depth = 0;

    for (let i = 0; i < expression.length; i++) {
        const currentCharacter = expression[i];
        const isQuoted = quoteCharacter !== '';

        if (!isQuoted && (currentCharacter === '\'' || currentCharacter === '"')) {
            quoteCharacter = currentCharacter;
            continue;
        }
        if (isQuoted && currentCharacter === quoteCharacter) {
            quoteCharacter = '';
            continue;
        }
        if (isQuoted) {
            continue;
        }

        if (currentCharacter === '(') {
            depth++;
            continue;
        }
        if (currentCharacter === ')') {
            depth--;
            if (depth === 0 && i < expression.length - 1) {
                return false;
            }
        }
    }

    return depth === 0;
};
