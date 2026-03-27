import React, { useState, useEffect } from 'react';

const BarChart = ({
  data = [],
  maxValue = 100,
  height = 200,
  barColor = '#1A1A2E',
}) => {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const containerStyles = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  };

  const yAxisStyles = {
    display: 'flex',
    gap: '20px',
  };

  const axisLabelsStyles = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    gap: '0',
    width: '40px',
    textAlign: 'right',
    paddingRight: '12px',
  };

  const axisLabelStyles = {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    height: `${height / 4}px`,
    display: 'flex',
    alignItems: 'flex-end',
  };

  const chartAreaStyles = {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: height,
    gap: '12px',
    flex: 1,
    paddingBottom: '0',
  };

  const barWrapperStyles = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
    maxWidth: '80px',
  };

  const getBarHeight = (value) => {
    const computed = (value / maxValue) * height;
    return animated ? computed : 0;
  };

  const labelStyles = {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
    lineHeight: '1.2',
  };

  return (
    <div style={containerStyles}>
      <div style={yAxisStyles}>
        <div style={axisLabelsStyles}>
          {[100, 75, 50, 25, 0].map((label) => (
            <div key={label} style={axisLabelStyles}>
              {label}
            </div>
          ))}
        </div>
        <div style={chartAreaStyles}>
          {data.map((item, index) => {
            const barH = getBarHeight(item.value);
            const showValue = barH > 30;
            return (
              <div key={index} style={barWrapperStyles}>
                <div
                  style={{
                    width: '100%',
                    height: `${barH}px`,
                    backgroundColor: item.color || barColor,
                    borderRadius: '8px 8px 0 0',
                    transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                    paddingTop: showValue ? '8px' : '0',
                    minHeight: animated && item.value > 0 ? '4px' : '0',
                  }}
                >
                  {showValue && (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'white',
                      }}
                    >
                      {item.value}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          gap: '12px',
          paddingLeft: '52px',
        }}
      >
        {data.map((item, index) => (
          <div key={index} style={{ ...barWrapperStyles, flex: 1, maxWidth: '80px', gap: '0', marginTop: '-8px' }}>
            <div style={labelStyles}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarChart;
