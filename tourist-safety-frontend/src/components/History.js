import React, { useEffect, useState } from 'react';

function History() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        // Make sure your backend route is correct
        fetch('http://localhost:5000/api/history', {
                headers: { 'x-user-id': userId }
            })
            .then(res => res.json())
            .then(data => setHistory(data))
            .catch(err => console.error("Error fetching history:", err));
    }, []);

    return ( <
            div className = "hover-card" >
            <
            h3 > 📜Travel History < /h3> {
            history.length === 0 ? < p > No history found. < /p> : 
            history.map(item =>
                ( <
                    p key = { item._id } > { item.place } - { new Date(item.visitDate).toLocaleDateString() } < /p>
                ))
        } <
        /div>
);
}

export default History;