import type { StrictComponent } from '../react';

// Components with explicit props compile successfully.
type TitleProps = { title: string };

export const TitleComponent: StrictComponent<TitleProps> = ({ title }) => {
  title.toUpperCase();
  return null;
};

// Components without props can omit the generic parameter.
export const ChildOnlyComponent: StrictComponent = ({ children }) => {
  void children;
  return null;
};

// @ts-expect-error Explicit props are required when additional fields are accessed.
export const MissingPropDeclaration: StrictComponent = ({ title }) => {
  void title;
  return null;
};

// @ts-expect-error Accessing props that are not declared surfaces an error.
export const WrongPropName: StrictComponent<TitleProps> = ({ title, missing }) => {
  void title;
  void missing;
  return null;
};

export {};
