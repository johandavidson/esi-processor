import { AnyNode, Comment, Element, ProcessingInstruction, Text, hasChildren, isComment, isDirective, isTag, isText } from 'domhandler';

export type DomElement = AnyNode;

export const isTagNode = (node: DomElement): node is Element => {
    return isTag(node);
};

export const hasChildNodes = (node: DomElement): boolean => {
    return hasChildren(node);
};

export const getChildNodes = (node: DomElement): DomElement[] => {
    return hasChildren(node) ? node.children : [];
};

export const setChildNodes = (node: DomElement, children: DomElement[]): void => {
    if (hasChildren(node)) {
        node.children = children;
    }
};

export const isDataNode = (node: DomElement): node is Text | Comment | ProcessingInstruction => {
    return isText(node) || isComment(node) || isDirective(node);
};

export const createCommentNode = (value: string): DomElement => {
    return new Comment(value);
};

export const createTextNode = (value: string): DomElement => {
    return new Text(value);
};
