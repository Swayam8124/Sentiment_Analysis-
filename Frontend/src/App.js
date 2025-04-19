import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import 'chart.js/auto';

function App() {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE = "http://localhost:5000";

  const analyzeText = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`${API_BASE}/analyze`, { 
        text 
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (!response.data || !response.data.data) {
        throw new Error("Invalid response structure from server");
      }

      setResult(response.data.data);
      await fetchHistory();
      setText('');
    } catch (err) {
      console.error("Analysis error:", err);
      setError(err.response?.data?.error || err.message || "Failed to analyze text. Check backend connection.");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API_BASE}/history`);
      
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error("Invalid history data format");
      }

      setHistory(response.data.data);
    } catch (err) {
      console.error("History fetch error:", err);
      setError(err.response?.data?.error || err.message || "Failed to load history");
    }
  };

  useEffect(() => { 
    fetchHistory(); 
  }, []);

  const chartData = {
    labels: ['Positive', 'Negative', 'Neutral'],
    datasets: [{
      data: [
        history.filter(item => item?.sentiment === 'positive').length,
        history.filter(item => item?.sentiment === 'negative').length,
        history.filter(item => item?.sentiment === 'neutral').length,
      ],
      backgroundColor: [
        'rgba(76, 175, 80, 0.8)',   // Positive (green)
        'rgba(244, 67, 54, 0.8)',    // Negative (red)
        'rgba(158, 158, 158, 0.8)'   // Neutral (gray)
      ],
      borderColor: [
        'rgba(76, 175, 80, 1)',
        'rgba(244, 67, 54, 1)',
        'rgba(158, 158, 158, 1)'
      ],
      borderWidth: 1,
      hoverOffset: 8
    }],
  };

  return (
    <div style={{ 
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale'
    }}>
      <h1 style={{ 
        textAlign: 'center',
        margin: '0 0 10px 0',
        color: '#2c3e50',
        textShadow: '0 1px 1px rgba(0,0,0,0.1)'
      }}>Sentiment Analysis Dashboard</h1>

      {error && (
        <div style={{ 
          color: 'white',
          backgroundColor: '#e74c3c',
          padding: '10px',
          borderRadius: '4px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          {error}
        </div>
      )}

      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <textarea 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type something to analyze..."
          style={{ 
            width: '100%',
            height: '100px',
            padding: '10px',
            marginBottom: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '16px',
            resize: 'vertical',
            outline: 'none',
            transition: 'border 0.3s',
            ':focus': {
              borderColor: '#2ecc71'
            }
          }}
        />
        <button 
          onClick={analyzeText}
          disabled={loading || !text.trim()}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#95a5a6' : '#2ecc71',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            transition: 'background-color 0.3s',
            ':hover': {
              backgroundColor: loading ? '#95a5a6' : '#27ae60'
            }
          }}
        >
          {loading ? 'Analyzing...' : 'Analyze Text'}
        </button>
      </div>

      {result && (
        <div style={{
          backgroundColor: '#f8f9fa',
          padding: '15px 20px',
          borderRadius: '8px',
          margin: '10px 0',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ 
            marginTop: 0,
            marginBottom: '10px'
          }}>Latest Analysis</h3>
          <p style={{ margin: '8px 0' }}><strong>Text:</strong> {result.text}</p>
          <p style={{ margin: '8px 0' }}>
            <strong>Sentiment:</strong> 
            <span style={{
              color: result.sentiment === 'positive' ? '#27ae60' :
                    result.sentiment === 'negative' ? '#e74c3c' : '#95a5a6',
              fontWeight: 'bold',
              marginLeft: '5px'
            }}>
              {result.sentiment}
            </span>
          </p>
          <p style={{ margin: '8px 0' }}>
            <strong>Score:</strong> 
            <span style={{ 
              color: result.polarity > 0 ? '#27ae60' : 
                    result.polarity < 0 ? '#e74c3c' : '#95a5a6',
              fontWeight: 'bold',
              marginLeft: '5px'
            }}>
              {result.polarity?.toFixed(2)}
            </span>
          </p>
        </div>
      )}

      <div style={{
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        height: '400px',
        position: 'relative',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>Sentiment Distribution</h3>
        {history.length > 0 ? (
          <Pie 
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              devicePixelRatio: window.devicePixelRatio || 1,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    font: {
                      size: 14,
                      family: 'Arial',
                      weight: 'bold'
                    },
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle',
                    color: '#2c3e50'
                  }
                },
                tooltip: {
                  bodyFont: {
                    size: 14,
                    weight: 'bold'
                  },
                  titleFont: {
                    size: 16
                  }
                }
              },
              elements: {
                arc: {
                  borderWidth: 0
                }
              }
            }}
          />
        ) : (
          <p style={{ 
            color: '#7f8c8d', 
            textAlign: 'center',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}>
            No data available for chart
          </p>
        )}
      </div>

      <div style={{
        backgroundColor: '#fff',
        padding: '50px',
        borderRadius: '8px',
        maxHeight: '400px',
        overflowY: 'auto',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ marginTop: 0 }}>Analysis History</h3>
        {history.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {history.map((item, index) => (
              <li 
                key={index}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid #eee',
                  backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background-color 0.3s',
                  ':hover': {
                    backgroundColor: '#f0f0f0'
                  }
                }}
              >
                <div>
                  <p style={{ 
                    margin: 0, 
                    fontStyle: 'italic',
                    wordBreak: 'break-word'
                  }}>"{item.text}"</p>
                </div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px',
                  flexShrink: 0
                }}>
                  <span style={{
                    color: item.sentiment === 'positive' ? '#27ae60' :
                          item.sentiment === 'negative' ? '#e74c3c' : '#95a5a6',
                    fontWeight: 'bold',
                    textShadow: '0 1px 1px rgba(0,0,0,0.1)'
                  }}>
                    {item.sentiment}
                  </span>
                  <span style={{
                    backgroundColor: '#ecf0f1',
                    color: '#2c3e50',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}>
                    {item.polarity?.toFixed(2)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ 
            color: '#7f8c8d', 
            textAlign: 'center',
            padding: '20px 0'
          }}>
            No analysis history yet
          </p>
        )}
      </div>
    </div>
  );
}

export default App;