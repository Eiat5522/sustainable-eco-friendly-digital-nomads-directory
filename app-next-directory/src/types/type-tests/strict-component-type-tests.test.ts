import path from 'node:path';
import { describe, expect, it } from '@jest/globals';
import ts from 'typescript';

const projectRoot = path.resolve(__dirname, '../../..');
const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

function createTypeTestProgram(filePath: string) {
  const configFile = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  if (configFile.error) {
    throw new Error(ts.flattenDiagnosticMessageText(configFile.error.messageText, '\n'));
  }

  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);
  const options: ts.CompilerOptions = { ...parsed.options, incremental: false, noEmit: true };

  const program = ts.createProgram({ rootNames: [filePath], options });
  const source = program.getSourceFile(filePath);
  if (!source) {
    throw new Error('Type test source file could not be loaded');
  }

  const moduleSymbol = program.getTypeChecker().getSymbolAtLocation(source) ?? source.symbol;
  if (!moduleSymbol) {
    throw new Error('Unable to resolve the module symbol for the type test file');
  }

  return { checker: program.getTypeChecker(), moduleSymbol };
}

function getExportedFunctionType(
  checker: ts.TypeChecker,
  moduleSymbol: ts.Symbol,
  exportName: string
) {
  const exportSymbol = checker
    .getExportsOfModule(moduleSymbol)
    .find(symbol => symbol.name === exportName);
  if (!exportSymbol || !exportSymbol.valueDeclaration) {
    throw new Error(`Export ${exportName} was not found in the strict component type tests.`);
  }

  const type = checker.getTypeOfSymbolAtLocation(exportSymbol, exportSymbol.valueDeclaration);
  const [signature] = checker.getSignaturesOfType(type, ts.SignatureKind.Call);
  if (!signature) {
    throw new Error(`Export ${exportName} does not expose a callable signature.`);
  }

  return signature;
}

function getPropType(checker: ts.TypeChecker, propsType: ts.Type, propertyName: string) {
  const propertySymbol = checker.getPropertyOfType(propsType, propertyName);
  if (!propertySymbol) {
    return undefined;
  }
  const declaration = propertySymbol.valueDeclaration ?? propertySymbol.declarations?.[0];
  if (!declaration) {
    throw new Error(`Property ${propertyName} did not expose a declaration.`);
  }
  return checker.getTypeOfSymbolAtLocation(propertySymbol, declaration);
}

describe('strict component type tests', () => {
  const typeTestPath = path.resolve(__dirname, 'strict-component-type-tests.tsx');

  it('infers props for explicitly typed components', () => {
    const { checker, moduleSymbol } = createTypeTestProgram(typeTestPath);
    const signature = getExportedFunctionType(checker, moduleSymbol, 'TitleComponent');
    const [propsParam] = signature.parameters;
    const propsType = checker.getTypeOfSymbolAtLocation(propsParam, propsParam.valueDeclaration!);

    const titlePropType = getPropType(checker, propsType, 'title');
    expect(titlePropType).toBeDefined();
    expect(checker.typeToString(titlePropType!)).toBe('string');
  });

  it('provides children support when props are omitted', () => {
    const { checker, moduleSymbol } = createTypeTestProgram(typeTestPath);
    const signature = getExportedFunctionType(checker, moduleSymbol, 'ChildOnlyComponent');
    const [propsParam] = signature.parameters;
    const propsType = checker.getTypeOfSymbolAtLocation(propsParam, propsParam.valueDeclaration!);

    const childrenType = getPropType(checker, propsType, 'children');
    expect(childrenType).toBeDefined();
    expect(checker.typeToString(childrenType!)).toContain('ReactNode');
  });

  it('omits undeclared props when the generic parameter is not provided', () => {
    const { checker, moduleSymbol } = createTypeTestProgram(typeTestPath);
    const signature = getExportedFunctionType(checker, moduleSymbol, 'MissingPropDeclaration');
    const [propsParam] = signature.parameters;
    const propsType = checker.getTypeOfSymbolAtLocation(propsParam, propsParam.valueDeclaration!);

    const titleType = getPropType(checker, propsType, 'title');
    expect(titleType).toBeUndefined();
    const availableProps = checker.getPropertiesOfType(propsType).map(prop => prop.name);
    expect(availableProps).toEqual(['children']);
  });
});
