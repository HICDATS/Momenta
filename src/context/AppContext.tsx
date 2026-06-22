import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from 'react';

export interface AppState {
  currentPage: string;
  isOffline: boolean;
}

export type AppAction =
  | { type: 'SET_PAGE'; page: string }
  | { type: 'SET_OFFLINE'; offline: boolean };

export interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<AppAction>;
}

const initialState: AppState = {
  currentPage: '/',
  isOffline: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, currentPage: action.page };
    case 'SET_OFFLINE':
      return { ...state, isOffline: action.offline };
    default:
      return state;
  }
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
}
