import { Link } from "react-router-dom";
import { Outlet } from "react-router-dom";

const TopBar = () => {
    return (
        <>
            <div style={{
                position: "fixed",
                margin: "auto",
                top:"0",
                left: "0",
                display: "inline-block",
                background: "white",
                width: "100%",
                height: "50px",
                padding: "40px",
                border: "1px, solid black",
                boxShadow: "0px 0px 5px black"

            }}>
                <a class="linkObj"><Link to="/dashboard">dash</Link></a>
                <a class="linkObj"><Link to="/study">study</Link></a>
                <a class="linkObj"><Link to="/groups">groups</Link></a>
                <a class="linkObj"><Link to="/storage">storage</Link></a>
            </div >
            <Outlet />
        </>
    );
}

export default TopBar;