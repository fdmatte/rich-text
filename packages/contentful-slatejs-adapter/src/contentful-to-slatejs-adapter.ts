import flatmap from 'lodash.flatmap';

import * as Contentful from '@fdmatte/rich-text-types';
import { ContentfulNode, SlateNode, ContentfulNonTextNodes } from './types';
import { getDataOfDefault } from './helpers';
import { SchemaJSON, fromJSON, Schema } from './schema';

export interface ToSlatejsDocumentProperties {
  document: Contentful.Document;
  schema?: SchemaJSON;
}

export default function toSlatejsDocument({
  document,
  schema,
}: ToSlatejsDocumentProperties): Slate.Document {
  return {
    object: 'document',
    data: getDataOfDefault(document.data),
    nodes: flatmap(document.content, node => convertNode(node, fromJSON(schema))) as Slate.Block[],
  };
}

function convertNode(node: ContentfulNode, schema: Schema): SlateNode[] {
  const nodes: SlateNode[] = [];

  if (node.nodeType === 'text') {
    const slateText = convertTextNode(node);

    nodes.push(slateText);
  } else {
    const contentfulNode = node as ContentfulNonTextNodes;
    const childNodes = flatmap(contentfulNode.content, childNode => convertNode(childNode, schema));

    const object = getSlateNodeObjectValue(contentfulNode.nodeType);
    let slateNode: SlateNode;
    if (object === 'inline') {
      slateNode = createInlineNode(contentfulNode, childNodes, schema);
    } else if (object === 'block') {
      slateNode = createBlockNode(contentfulNode, childNodes, schema);
    } else {
      throw new Error(`Unexpected slate object '${object}'`);
    }
    nodes.push(slateNode);
  }
  return nodes;
}

function createBlockNode(
  contentfulBlock: ContentfulNonTextNodes,
  childNodes: SlateNode[],
  schema: Schema,
): Slate.Block {
  return {
    object: 'block',
    type: contentfulBlock.nodeType,
    nodes: childNodes,
    isVoid: schema.isVoid(contentfulBlock),
    data: getDataOfDefault(contentfulBlock.data),
  } as Slate.Block;
}

function createInlineNode(
  contentfulBlock: ContentfulNonTextNodes,
  childNodes: SlateNode[],
  schema: Schema,
): Slate.Inline {
  return {
    object: 'inline',
    type: contentfulBlock.nodeType,
    nodes: childNodes,
    isVoid: schema.isVoid(contentfulBlock),
    data: getDataOfDefault(contentfulBlock.data),
  } as Slate.Inline;
}

function convertTextNode(node: ContentfulNode): Slate.Text {
  const { marks = [], value, data } = node as Contentful.Text;
  const slateText: Slate.Text = {
    object: 'text',
    leaves: [
      {
        object: 'leaf',
        text: value,
        marks: marks.map(mark => ({
          ...mark,
          data: {},
          object: 'mark',
        })),
      } as Slate.TextLeaf,
    ],
    data: getDataOfDefault(data),
  };
  return slateText;
}

function getSlateNodeObjectValue(nodeType: string): 'inline' | 'block' {
  if (Object.values(Contentful.BLOCKS).includes(nodeType)) {
    return 'block';
  } else if (Object.values(Contentful.INLINES).includes(nodeType)) {
    return 'inline';
  } else {
    throw new Error(`Unexpected contentful nodeType '${nodeType}'`);
  }
}
