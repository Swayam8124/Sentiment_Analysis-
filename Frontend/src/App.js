import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeText = async () => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5000/analyze', { text });
      setResult(response.data);
      await fetchHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/history');
      // Access response.data.data instead of response.data
      setHistory(response.data.data || []);
    } catch (err) {
      setError("Failed to load history");
    }
  };

  useEffect(() => { 
    fetchHistory(); 
  }, []);

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [
        history.filter(item => item.sentiment === 'positive').length,
        history.filter(item => item.sentiment === 'negative').length,
        history.filter(item => item.sentiment === 'neutral').length,
      ],
      backgroundColor: ['#4CAF50', '#F44336', '#9E9E9E'],
    }],
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Sentiment Analysis</h1>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        style={{ width: '100%', height: '100px' }}
      />
      <button onClick={analyzeText} disabled={loading}>
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>

      {result && (
        <div>
          <h3>Result: {result.sentiment} (Score: {result.polarity?.toFixed(2)})</h3>
        </div>
      )}

      <h2>Sentiment Distribution</h2>
      <Pie data={chartData} />

      <h2>Recent Analyses</h2>
      <ul>
        {history.map((item, index) => (
          <li key={index}>
            "{item.text}" → <strong>{item.sentiment}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;