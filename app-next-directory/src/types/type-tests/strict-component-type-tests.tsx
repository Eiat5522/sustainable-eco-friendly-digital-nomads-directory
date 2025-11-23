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

// Explicit props are required when additional fields are accessed.
export const MissingPropDeclaration: StrictComponent = ({ title }) => {
  void title;
  return null;
};

export const WrongPropName: StrictComponent<TitleProps> = (props) => {
  const { title } = props;
  void title;
  // @ts-expect-error Accessing props that are not declared surfaces an error.
  const { missing }: { missing: string } = props;
  void missing;
  return null;
};
