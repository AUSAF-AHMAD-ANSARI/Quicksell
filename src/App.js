import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, SignalMedium, SignalLow, Plus, MoreHorizontal } from 'lucide-react';

const priorityIcons = {
  0: null,
  1: <SignalLow className="priority-icon" />,
  2: <SignalMedium className="priority-icon" />,
  3: <SignalMedium className="priority-icon" />,
  4: null
};

const priorityNames = {
  0: 'No priority',
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Urgent'
};

const statusIcons = {
  'Backlog': '○',
  'Todo': '○',
  'In progress': '◔',
  'Done': '●',
  'Canceled': '○',
};

export default function Component() {
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [grouping, setGrouping] = useState('priority');
  const [ordering, setOrdering] = useState('priority');
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [selectedCards, setSelectedCards] = useState([]);

  useEffect(() => {
    fetch('https://api.quicksell.co/v1/internal/frontend-assignment')
      .then(response => response.json())
      .then(data => {
        setTickets(data.tickets);
        setUsers(data.users);
      });
  }, []);

  useEffect(() => {
    const savedState = localStorage.getItem('kanbanState');
    if (savedState) {
      const { grouping: savedGrouping, ordering: savedOrdering } = JSON.parse(savedState);
      setGrouping(savedGrouping);
      setOrdering(savedOrdering);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kanbanState', JSON.stringify({ grouping, ordering }));
  }, [grouping, ordering]);

  const groupTickets = () => {
    let grouped = {};
    if (grouping === 'priority') {
      grouped = tickets.reduce((acc, ticket) => {
        const key = ticket.priority.toString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(ticket);
        return acc;
      }, {});
    } else if (grouping === 'user') {
      grouped = tickets.reduce((acc, ticket) => {
        const user = users.find(u => u.id === ticket.userId);
        const key = user ? user.name : 'Unassigned';
        if (!acc[key]) acc[key] = [];
        acc[key].push(ticket);
        return acc;
      }, {});
    } else if (grouping === 'status') {
      grouped = tickets.reduce((acc, ticket) => {
        const key = ticket.status;
        if (!acc[key]) acc[key] = [];
        acc[key].push(ticket);
        return acc;
      }, {});
    }

    Object.keys(grouped).forEach(key => {
      grouped[key].sort((a, b) => {
        if (ordering === 'priority') {
          return b.priority - a.priority;
        } else {
          return a.title.localeCompare(b.title);
        }
      });
    });

    return grouped;
  };

  const groupedTickets = groupTickets();

  const toggleDisplay = () => setIsDisplayOpen(!isDisplayOpen);

  const toggleCardSelection = (ticketId, event) => {
    event.stopPropagation();
    setSelectedCards(prev => 
      prev.includes(ticketId) 
        ? prev.filter(id => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const renderGroupIcon = (group) => {
    if (grouping === 'priority') {
      return priorityIcons[group];
    } else if (grouping === 'status') {
      return <span className="status-icon">{statusIcons[group] || '○'}</span>;
    } else {
      return null;
    }
  };

  const getGroupName = (group) => {
    if (grouping === 'priority') {
      return priorityNames[group];
    } else {
      return group;
    }
  };

  const getRandomProfileImage = () => {
    const randomId = Math.floor(Math.random() * 1000);
    return `https://i.pravatar.cc/40?img=${randomId}`;
  };

  return (
    <div className="kanban-board">
      <div className="header">
        <div className="display-button" onClick={toggleDisplay}>
          <span className="icon">≡</span> Display
          <span className="arrow">▼</span>
        </div>
        {isDisplayOpen && (
          <div className="display-options">
            <div className="option">
              <label>Grouping</label>
              <select value={grouping} onChange={(e) => setGrouping(e.target.value)}>
                <option value="priority">Priority</option>
                <option value="user">User</option>
                <option value="status">Status</option>
              </select>
            </div>
            <div className="option">
              <label>Ordering</label>
              <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
                <option value="priority">Priority</option>
                <option value="title">Title</option>
              </select>
            </div>
          </div>
        )}
      </div>
      <div className="board">
        {Object.entries(groupedTickets).map(([group, groupTickets]) => (
          <div key={group} className="column">
            <h2>
              {grouping === 'user' && (
                <img src={getRandomProfileImage()} alt="User Avatar" className="group-avatar" />
              )}
              {renderGroupIcon(group)}
              <span className="group-name">{getGroupName(group)}</span>
              <span className="ticket-count">{groupTickets.length}</span>
              <div className="group-actions">
                <button className="action-button">
                  <Plus size={16} />
                </button>
                <button className="action-button">
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </h2>
            {groupTickets.map(ticket => (
              <div 
                key={ticket.id} 
                className="card"
              >
                <div className="card-header">
                  <span className="ticket-id">{ticket.id}</span>
                  <img
                    src={`https://api.dicebear.com/6.x/initials/svg?seed=${users.find(u => u.id === ticket.userId)?.name}`}
                    alt="User Avatar"
                    className="user-avatar"
                  />
                </div>
                <div className="card-title">
                  <div 
                    className="checkbox-wrapper"
                    onClick={(e) => toggleCardSelection(ticket.id, e)}
                  >
                    {selectedCards.includes(ticket.id) ? (
                      <CheckCircle className="checkbox selected" />
                    ) : (
                      <Circle className="checkbox" />
                    )}
                  </div>
                  <h3>{ticket.title}</h3>
                </div>
                <div className="card-footer">
                  <span className="feature-tag">
                    <span className="tag-icon">
                      {ticket.tag && ticket.tag[0] ? '●' : '○'}
                    </span>
                    {ticket.tag && ticket.tag[0] ? ticket.tag[0] : 'No Tag'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
      <style jsx>{`
        .kanban-board {
          font-family: Arial, sans-serif;
          background-color: #f4f5f8;
          min-height: 100vh;
        }
        .header {
          padding: 16px;
          background-color: white;
          border-bottom: 1px solid #e0e0e0;
        }
        .display-button {
          display: inline-flex;
          align-items: center;
          background-color: white;
          border: 1px solid #e0e0e0;
          padding: 8px 12px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .icon {
          margin-right: 8px;
        }
        .arrow {
          margin-left: 8px;
        }
        .display-options {
          position: absolute;
          margin-top: 8px;
          padding: 16px;
          background-color: white;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          z-index: 10;
        }
        .option {
          margin-bottom: 12px;
        }
        .option label {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        .option select {
          width: 100%;
          padding: 6px;
          font-size: 14px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
        }
        .board {
          display: flex;
          padding: 24px;
          overflow-x: auto;
        }
        .column {
          flex: 0 0 300px;
          margin-right: 24px;
        }
        .column h2 {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
        }
        .group-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
        }
        .priority-icon {
          margin-right: 8px;
          width: 16px;
          height: 16px;
        }
        .status-icon {
          margin-right: 8px;
          font-size: 16px;
        }
        .group-name {
          margin-right: 8px;
        }
        .ticket-count {
          color: #6b6f76;
          margin-right: 8px;
        }
        .group-actions {
          margin-left: auto;
          display: flex;
          gap: 8px;
        }
        .action-button {
          background: none;
          border: none;
          cursor: pointer;
          color: #6b6f76;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          background-color: white;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .ticket-id {
          color: #6b6f76;
          font-size: 14px;
        }
        .user-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .card-title {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        .checkbox-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          margin-right: 8px;
          cursor: pointer;
        }
        .checkbox {
          width: 16px;
          height: 16px;
          color: #6b6f76;
        }
        .checkbox.selected {
          color: #4a90e2;
        }
        .card h3 {
          font-size: 14px;
          font-weight: 500;
          margin: 0;
        }
        .card-footer {
          display: flex;
          align-items: center;
        }
        .feature-tag {
          font-size: 12px;
          color: #6b6f76;
          display: flex;
          align-items: center;
          background-color: #f4f5f8;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .tag-icon {
          margin-right: 4px;
        }
      `}</style>
    </div>
  );
}