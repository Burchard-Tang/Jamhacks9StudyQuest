import { useState, useEffect } from 'react';
import axios from 'axios';

const Groups = ({ user }) => {
    const [groupId, setGroupId] = useState(user?.group_id);
    const [joinCode, setJoinCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [rankings, setRankings] = useState([]);

    const handleJoin = async () => {
        try {
            const res = await axios.post('http://localhost:8081/joingroup', {
                userId: user.user_id,
                joinCode
            });
            alert('Joined group!');
            setGroupId(res.data.groupId);
        } catch (err) {
            alert('Join failed. Invalid code?');
        }
    };

    const handleCreate = async () => {
        if (!groupName.trim()) {
            alert('Group name cannot be empty');
            return;
        }
        try {
            const res = await axios.post('http://localhost:8081/creategroup', {
                groupName
            });
            await axios.post('http://localhost:8081/joingroup', {
                userId: user.user_id,
                joinCode: res.data.joinCode
            });
            alert(`Group created! Code: ${res.data.joinCode}`);
            setGroupId(res.data.groupId);
        } catch (err) {
            alert('Group creation failed');
        }
    };

    useEffect(() => {
        if (groupId) {
            axios.get('http://localhost:8081/grouprankings')
                .then(res => {
                    if (res.data.success) setRankings(res.data.rankings);
                });
        }
    }, [groupId]);

    return (
        <div>
            <h1>Groups</h1>
            {!groupId || groupId === -1 ? (
                <>
                    <h2>Join a Group</h2>
                    <input placeholder="Join Code" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
                    <button onClick={handleJoin}>Join</button>
                    <h2>Or Create a Group</h2>
                    <input placeholder="Group Name" value={groupName} onChange={e => setGroupName(e.target.value)} />
                    <button onClick={handleCreate}>Create</button>
                </>
            ) : (
                <>
                    <h2>Group Rankings (by University Tier)</h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Group Name</th>
                                <th>Average University Tier</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rankings.map(r => (
                                <tr key={r.group_id}>
                                    <td>{r.group_name}</td>
                                    <td>{r.avg_university_tier.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </>
            )}
        </div>
    );
};

export default Groups;
