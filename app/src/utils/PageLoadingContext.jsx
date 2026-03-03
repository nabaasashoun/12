import { createContext, useContext, useState } from 'react';

const PageLoadingContext = createContext();

export function PageLoadingProvider({ children }) {
  const [isPageLoading, setIsPageLoading] = useState(false);

  return (
    <PageLoadingContext.Provider value={{ isPageLoading, setIsPageLoading }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  return useContext(PageLoadingContext);
}