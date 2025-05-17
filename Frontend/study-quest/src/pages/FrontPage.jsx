import { Link, Outlet, useNavigate } from 'react-router-dom';

const FrontPage = () => {
    return(
        <>
            <h1>FrontPage</h1>
            <Link to="/app/dashboard">dash</Link>

        </>
    );
}

export default FrontPage;