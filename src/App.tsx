import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout/Layout';
import { Home } from './pages/Home/Home';
import { History } from './pages/History/History';
import { Achievements } from './pages/Achievements/Achievements';
import { Statistics } from './pages/Statistics/Statistics';
import { Settings } from './pages/Settings/Settings';
import styles from './App.module.css';

function App(): JSX.Element {
  return (
    <AppProvider>
      <BrowserRouter>
        <div className={styles.app}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/statistics" element={<Statistics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Routes>
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
