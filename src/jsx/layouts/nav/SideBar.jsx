import { Fragment, useEffect, useReducer, useState } from "react";
import { Collapse } from "react-bootstrap";
import { Modal } from "react-bootstrap";
/// Link
import { Link } from "react-router-dom";
import { MenuList } from "./Menu";
import { useScrollPosition } from "@n8tb1t/use-scroll-position";
import { useTranslation } from "react-i18next";

const reducer = (previousState, updatedState) => ({
  ...previousState,
  ...updatedState,
});

const initialState = {
  active: "",
  activeSubmenu: "",
};

const SideBar = () => {
  var d = new Date();
  const [addMenus, setAddMenus] = useState(false);
  const [state, setState] = useReducer(reducer, initialState);
  let handleheartBlast = document.querySelector(".heart");
  function heartBlast() {
    return handleheartBlast.classList.toggle("heart-blast");
  }

  const [hideOnScroll, setHideOnScroll] = useState(true);
  useScrollPosition(
    ({ prevPos, currPos }) => {
      const isShow = currPos.y > prevPos.y;
      if (isShow !== hideOnScroll) setHideOnScroll(isShow);
    },
    [hideOnScroll]
  );

  const handleMenuActive = (status) => {
    setState({ active: status });
    if (state.active === status) {
      setState({ active: "" });
    }
  };
  const handleSubmenuActive = (status) => {
    setState({ activeSubmenu: status });
    if (state.activeSubmenu === status) {
      setState({ activeSubmenu: "" });
    }
  };

  /// Path
  let path = window.location.pathname;
  path = path.split("/");
  path = path[path.length - 1];
  useEffect(() => {
    MenuList.forEach((data) => {
      data.content?.forEach((item) => {
        if (path === item.to) {
          setState({ active: data.title });
        }
        item.content?.forEach((ele) => {
          if (path === ele.to) {
            setState({ activeSubmenu: item.title, active: data.title });
          }
        });
      });
    });
  }, [path]);

  const { t } = useTranslation();
  return (
    <div className="deznav">
      <div className="deznav-scroll dz-scroll">
        <ul className="metismenu" id="menu">
          {MenuList.map((data, index) => {
            let menuClass = data.classsChange;
            if (menuClass === "menu-title") {
              return (
                <li className={menuClass} key={index}>
                  {t(data.title)}
                </li>
              );
            } else {
              return (
                <li
                  className={` ${
                    state.active === data.title ? "mm-active" : ""
                  } ${data.to === path ? "mm-active" : ""}`}
                  key={index}
                >
                  {data.content && data.content.length > 0 ? (
                    <Fragment>
                      <Link
                        to={"#"}
                        className="has-arrow"
                        onClick={() => {
                          handleMenuActive(data.title);
                        }}
                      >
                        {data.iconStyle}{" "}
                        <span className="nav-text">{t(data.title)}</span>
                      </Link>
                      <Collapse in={state.active === data.title ? true : false}>
                        <ul
                          className={`${
                            menuClass === "mm-collapse" ? "mm-show" : ""
                          }`}
                        >
                          {data.content &&
                            data.content.map((data, index) => {
                              return (
                                <li
                                  key={index}
                                  className={`${
                                    state.activeSubmenu === data.title
                                      ? "mm-active"
                                      : ""
                                  } ${data.to === path ? "mm-active" : ""}`}
                                >
                                  {data.content && data.content.length > 0 ? (
                                    <>
                                      <Link
                                        to={data.to}
                                        className={
                                          data.hasMenu ? "has-arrow" : ""
                                        }
                                        onClick={() => {
                                          handleSubmenuActive(data.title);
                                        }}
                                      >
                                        {t(data.title)}
                                      </Link>
                                      {/* ... */}
                                    </>
                                  ) : (
                                    <Link
                                      to={data.to}
                                      className={`${
                                        data.to === path ? "mm-active" : ""
                                      }`}
                                    >
                                      {t(data.title)}
                                    </Link>
                                  )}
                                </li>
                              );
                            })}
                        </ul>
                      </Collapse>
                    </Fragment>
                  ) : (
                    <Link to={data.to}>
                      {data.iconStyle}
                      <span className="nav-text">{t(data.title)}</span>
                    </Link>
                  )}
                </li>
              );
            }
          })}
        </ul>

        <Modal show={addMenus} onHide={setAddMenus} centered>
          <Modal.Header closeButton>
            <Modal.Title>Add Menus</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form>
              <div className="mb-3">
                <label className="form-label">Food Name</label>
                <input type="text" className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label">Order Date</label>
                <input type="date" className="form-control" />
              </div>
              <div className="mb-3">
                <label className="form-label">Food Price</label>
                <input type="text" className="form-control" />
              </div>
              <div className="mb-3">
                <button type="button" className="btn btn-primary">
                  Submit
                </button>
              </div>
            </form>
          </Modal.Body>
        </Modal>
        <div className="copyright">
          <p>
            <strong>Sego Restaurant Admin Dashboard</strong> © {d.getFullYear()}{" "}
            All Rights Reserved
          </p>
          <p>
            Made with{" "}
            <span className="heart" onClick={() => heartBlast()}></span> by
            DexignZone
          </p>
        </div>
      </div>
    </div>
  );
};

export default SideBar;
