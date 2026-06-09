import React, { createContext, useContext, useCallback, useState } from 'react';

type Params = Record<string, any>;

type NavigationContextType = {
  navigate: (route: string, params?: Params) => void;
  goBack: () => void;
  routeParams: Params | null;
};

const NavigationContext = createContext<NavigationContextType>({
  navigate: () => {},
  goBack: () => {},
  routeParams: null,
});

type Props = {
  children: React.ReactNode;
  onNavigate: (route: string) => void;
};

export function NavigationProvider({ children, onNavigate }: Props) {
  const [routeParams, setRouteParams] = useState<Params | null>(null);

  const navigate = useCallback((route: string, params?: Params) => {
    setRouteParams(params || null);
    onNavigate(route);
  }, [onNavigate]);

  const goBack = useCallback(() => {
    setRouteParams(null);
  }, []);

  return (
    <NavigationContext.Provider value={{ navigate, goBack, routeParams }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useAppNavigation() {
  return useContext(NavigationContext);
}

export default NavigationContext;
