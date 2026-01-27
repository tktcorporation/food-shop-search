/** @type {import('eslint').ESLint.Plugin} */
const plugin = {
  meta: {
    name: 'effect-enforce',
    version: '1.0.0',
  },
  rules: {
    'no-promise-constructor': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'new Promise() は禁止。Effect.async() または Effect.tryPromise() を使用',
        },
        messages: {
          forbidden:
            'new Promise() は禁止です。Effect.async() または Effect.tryPromise() を使用してください。',
        },
      },
      create(context) {
        return {
          NewExpression(node) {
            if (
              node.callee.type === 'Identifier' &&
              node.callee.name === 'Promise'
            ) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },
    'no-promise-static-methods': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'Promise.all/race/allSettled は禁止。Effect.all() / Effect.race() を使用',
        },
        messages: {
          all: 'Promise.all() は禁止です。Effect.all() を使用してください。',
          race: 'Promise.race() は禁止です。Effect.race() を使用してください。',
          allSettled:
            "Promise.allSettled() は禁止です。Effect.all() with { mode: 'either' } を使用してください。",
        },
      },
      create(context) {
        return {
          CallExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'Promise' &&
              node.callee.property.type === 'Identifier'
            ) {
              const method = node.callee.property.name;
              if (
                method === 'all' ||
                method === 'race' ||
                method === 'allSettled'
              ) {
                context.report({ node, messageId: method });
              }
            }
          },
        };
      },
    },
    'no-throw-statement': {
      meta: {
        type: 'problem',
        docs: {
          description:
            'throw は禁止。Effect.fail() または Data.TaggedError を使用',
        },
        messages: {
          forbidden:
            'throw は禁止です。Effect.fail() または Data.TaggedError を使用してください。',
        },
      },
      create(context) {
        return {
          ThrowStatement(node) {
            context.report({ node, messageId: 'forbidden' });
          },
        };
      },
    },
  },
};

export default plugin;
