import { ESLint } from 'eslint';
import rule from '../../eslint/rules/require-react-fc-type-parameters.js';

describe('require-react-fc-type-parameters rule', () => {
  const createLinter = () =>
    new ESLint({
      useEslintrc: false,
      plugins: {
        local: {
          rules: {
            'require-react-fc-type-parameters': rule,
          },
        },
      },
      baseConfig: {
        plugins: ['local'],
        parser: '@typescript-eslint/parser',
        parserOptions: {
          ecmaVersion: 2022,
          sourceType: 'module',
          ecmaFeatures: { jsx: true },
        },
        rules: {
          'local/require-react-fc-type-parameters': 'error',
        },
      },
    });

  it('reports missing type parameters for React.FC usage', async () => {
    const eslint = createLinter();
    const results = await eslint.lintText(
      "const Component: React.FC = () => null;",
      { filePath: 'component.tsx' }
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.messages).toHaveLength(1);
    expect(results[0]?.messages[0]?.ruleId).toBe('local/require-react-fc-type-parameters');
  });

  it('reports missing type parameters for FC imported from react', async () => {
    const eslint = createLinter();
    const results = await eslint.lintText(
      "import { FC } from 'react';\nconst Component: FC = () => null;",
      { filePath: 'component.tsx' }
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.messages).toHaveLength(1);
    expect(results[0]?.messages[0]?.ruleId).toBe('local/require-react-fc-type-parameters');
  });

  it('does not report when explicit props are provided', async () => {
    const eslint = createLinter();
    const results = await eslint.lintText(
      "type Props = { title: string };\nconst Component: React.FC<Props> = ({ title }) => <div>{title}</div>;",
      { filePath: 'component.tsx' }
    );

    expect(results).toHaveLength(1);
    expect(results[0]?.messages).toHaveLength(0);
  });
});
