import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './screens/Home';
import { Join } from './screens/Join';
import { Board } from './screens/Board';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join" element={<Join />} />
        <Route path="/join/:code" element={<Join />} />
        <Route path="/r/:code" element={<Board />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
