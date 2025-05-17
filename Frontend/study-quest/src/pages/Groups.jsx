import { useState, useEffect } from 'react';
import axios from 'axios';
import './Groups.css';

const Groups = () => {
    const user = JSON.parse(localStorage.getItem('user')) || {};
    const [groupId, setGroupId] = useState(user.group_id || -1);
    const [joinCode, setJoinCode] = useState('');
    const [groupName, setGroupName] = useState('');
    const [rankings, setRankings] = useState([]);
    const [groupData, setGroupData] = useState();
    const [groupMembers, setGroupMembers] = useState([]);

    const universityTiers = [
        'Deferred to geomatics', 'Stanford', 'MIT', 'Harvard', 'Waterloo CS', 'UofT',
        'UBC', 'McMaster', 'Queens', 'Toronto Metropolitan', 'York', 'Seneca',
        "You're cooked", 'Brock Gender Studies',
    ];

    useEffect(() => {
        const fetchGroupData = async () => {
            if (!groupId || groupId === -1) {
                setGroupData(null);
                return;
            }
            try {
                const res = await axios.get(`http://localhost:8081/group/${groupId}`);
                if (res.data.success) {
                    setGroupData(res.data.group);
                } else {
                    setGroupData(null);
                }
            } catch (error) {
                console.error('Error fetching group data:', error);
                setGroupData(null);
            }
        };

        fetchGroupData();
    }, [groupId]);

    const fetchRankings = async () => {
        try {
            const res = await axios.get('http://localhost:8081/grouprankings');
            if (res.data.success) {
                setRankings(res.data.rankings);
            } else {
                setRankings([]);
            }
        } catch (error) {
            console.error('Error fetching rankings:', error);
            setRankings([]);
        }
    };

    useEffect(() => {
        fetchRankings();
    }, [groupId]);

    const fetchGroupMembers = async () => {
        if (!groupId || groupId === -1) {
            setGroupMembers([]);
            return;
        }
        try {
            const res = await axios.get(`http://localhost:8081/group/${groupId}/users`);
            if (res.data.success) {
                setGroupMembers(res.data.users);
            } else {
                setGroupMembers([]);
            }
        } catch (error) {
            console.error('Error fetching group members:', error);
            setGroupMembers([]);
        }
    };

    useEffect(() => {
        fetchGroupMembers();
    }, [groupId]);

    const handleJoin = async () => {
        if (!joinCode) {
            alert('Please enter a join code');
            return;
        }
        try {
            const res = await axios.post('http://localhost:8081/joingroup', {
                userId: user.user_id,
                joinCode,
            });
            if (res.data.success) {
                setGroupId(res.data.groupId);
                localStorage.setItem('user', JSON.stringify({ ...user, group_id: res.data.groupId }));
                alert('Successfully joined the group!');
                fetchRankings();
                fetchGroupMembers();
            } else {
                alert('Failed to join the group. Please check the join code.');
            }
        } catch (error) {
            console.error('Error joining group:', error);
            alert('An error occurred while joining the group.');
        }
    };

    const handleCreate = async () => {
        if (!groupName) {
            alert('Please enter a group name');
            return;
        }
        try {
            const res = await axios.post('http://localhost:8081/creategroup', { groupName });
            if (res.data.success) {
                const res2 = await axios.post('http://localhost:8081/joingroup', {
                    userId: user.user_id,
                    joinCode: res.data.joinCode,
                });
                if (res2.data.success) {
                    setGroupId(res2.data.groupId);
                    localStorage.setItem('user', JSON.stringify({ ...user, group_id: res2.data.groupId }));
                    alert(`Successfully created the group! Join Code: ${res.data.joinCode}`);
                    fetchRankings();
                    fetchGroupMembers();
                }
            } else {
                alert('Failed to create the group. Please try again.');
            }
        } catch (error) {
            console.error('Error creating group:', error);
            alert('An error occurred while creating the group.');
        }
    };

    return (
        <div className="groups-container">
            <h1>Groups</h1>

            {!groupId || groupId === -1 ? (
                <div className="groups-section">
                    <h2>Join a Group</h2>
                    <input
                        type="text"
                        placeholder="Enter Join Code"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value)}
                    />
                    <button onClick={handleJoin}>Join</button>

                    <h2 style={{ marginTop: '2rem' }}>Or Create a Group</h2>
                    <input
                        type="text"
                        placeholder="Enter Group Name"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                    />
                    <button onClick={handleCreate}>Create</button>
                </div>
            ) : (
                <>
                    {groupData && (
                        <div className="groups-section">
                            <h2>Your Group</h2>
                            <p><strong>Name:</strong> {groupData.group_name}</p>
                            <p><strong>Join Code:</strong> {groupData.join_code}</p>
                            <p><strong>Group ID:</strong> {groupData.group_id}</p>
                        </div>
                    )}
                    <div className="groups-section">
                        <h2>Group Members (ordered by University Tier)</h2>
                        <table className="groups-table">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Username</th>
                                    <th>University Tier</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groupMembers.map((member, idx) => (
                                    <tr key={member.user_id}>
                                        <td>{idx + 1}</td>
                                        <td>{member.username}</td>
                                        <td>
                                        {universityTiers[Math.min(Math.max((member.current_university ? member.current_university : 0, 0), universityTiers.length-1))] || member.current_university}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Groups;
