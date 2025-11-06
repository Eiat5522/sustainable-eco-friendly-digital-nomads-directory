const rule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require React.FC and React.FunctionComponent aliases to be instantiated with an explicit props type argument.',
      recommended: false,
    },
    schema: [],
    messages: {
      missingTypeParameter: '{{name}} must be provided an explicit props type argument.',
    },
  },
  create(context) {
    const importedFnComponentNames = new Set();

    return {
      Program() {
        importedFnComponentNames.clear();
      },
      ImportDeclaration(node) {
        if (node.source && node.source.value === 'react') {
          for (const specifier of node.specifiers) {
            if (specifier.type !== 'ImportSpecifier') {
              continue;
            }

            const importedName = specifier.imported && specifier.imported.name;
            if (importedName === 'FC' || importedName === 'FunctionComponent') {
              importedFnComponentNames.add(specifier.local.name);
            }
          }
        }
      },
      TSTypeReference(node) {
        const typeName = node.typeName;
        const typeParams = node.typeParameters ?? node.typeArguments;
        const hasTypeArguments = Boolean(typeParams && Array.isArray(typeParams.params) && typeParams.params.length > 0);

        if (typeName.type === 'TSQualifiedName') {
          const { left, right } = typeName;
          if (
            left.type === 'Identifier' &&
            left.name === 'React' &&
            (right.name === 'FC' || right.name === 'FunctionComponent') &&
            !hasTypeArguments
          ) {
            context.report({
              node,
              messageId: 'missingTypeParameter',
              data: { name: `React.${right.name}` },
            });
          }

          return;
        }

        if (typeName.type === 'Identifier' && importedFnComponentNames.has(typeName.name) && !hasTypeArguments) {
          context.report({
            node,
            messageId: 'missingTypeParameter',
            data: { name: typeName.name },
          });
        }
      },
    };
  },
};

export default rule;

