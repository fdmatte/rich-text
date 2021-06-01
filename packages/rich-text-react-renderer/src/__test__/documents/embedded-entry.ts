import { Document, BLOCKS } from '@fdmatte/rich-text-types';

export default function(entry: Object) {
  return {
    nodeType: BLOCKS.DOCUMENT,
    data: {},
    content: [
      {
        nodeType: BLOCKS.EMBEDDED_ENTRY,
        content: [],
        data: {
          target: entry,
        },
      },
    ],
  } as Document;
}
