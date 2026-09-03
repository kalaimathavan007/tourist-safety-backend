const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://tourist-safety-backend-production-ba8e.up.railway.app';

function History() {
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const userId = localStorage.getItem('userId');
        fetch(`${BACKEND_URL}/api/history`, {
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