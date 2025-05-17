import { Link, Outlet, useNavigate } from 'react-router-dom';

const FrontPage = () => {
    return(
        <>
            <h1>FrontPage</h1>
            <Link to="/login">Log in</Link>

        </>
    );
}

export default FrontPage;