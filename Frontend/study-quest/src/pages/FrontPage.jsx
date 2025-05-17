import { Link } from "react-router-dom";

const FrontPage = () => {
    return(
        <>
            <h1>FrontPage</h1>
            <Link to="/login">Login</Link>
        </>
    );
}

export default FrontPage;