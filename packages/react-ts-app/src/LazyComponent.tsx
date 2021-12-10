import React, {
  FC,
  lazy,
  Suspense,
  ComponentType,
  useState,
  useEffect,
  LazyExoticComponent,
} from 'react';

interface IShowTitleProps {
  title: string;
}

type ShowTitleComponentType = ComponentType<IShowTitleProps>;

const ShowTitle: FC<IShowTitleProps> = ({ title }) => <span>{title}</span>;

const factory = () =>
  new Promise<{ default: ShowTitleComponentType }>((resolve) => {
    setTimeout(
      () =>
        resolve({
          default: ShowTitle,
        }),
      2000
    );
  });

const SimpleTitle = lazy(factory);

export const LazyComponent: FC<{
  showLoading?: boolean;
  title: string;
}> = ({ showLoading = false, title }) => {
  const [DynamicComponent, setDynamicComponent] =
    useState<LazyExoticComponent<ShowTitleComponentType>>();

  useEffect(() => {
    setDynamicComponent(lazy(factory));
  }, [title]);

  return (
    <>
      <Suspense fallback={showLoading && 'loading...'}>
        {DynamicComponent && <DynamicComponent title={title} />}
      </Suspense>

      <br />

      <Suspense fallback={<p>loading once</p>}>
        <SimpleTitle title={title} />
      </Suspense>
    </>
  );
};
