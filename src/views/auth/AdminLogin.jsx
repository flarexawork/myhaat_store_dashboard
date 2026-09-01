import React, { useEffect, useState } from "react";
import { PropagateLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  admin_login,
  clearOtpChallenge,
  messageClear,
  retry_login_otp,
  verify_login_otp,
} from "../../store/Reducers/authReducer";
import { FiEye, FiEyeOff } from "react-icons/fi";
const AdminLogin = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    loader,
    errorMessage,
    successMessage,
    otpRequired,
    otpMaskedIdentifier,
    otpResendCooldownSeconds,
  } = useSelector(
    (state) => state.auth,
  );
  const [state, setSatate] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputHandle = (e) => {
    setSatate({
      ...state,
      [e.target.name]: e.target.value,
    });
  };
  const submit = (e) => {
    e.preventDefault();
    dispatch(admin_login(state));
  };
  const submitOtp = (e) => {
    e.preventDefault();
    const normalizedOtp = otp.replace(/\D/g, "");

    if (!normalizedOtp) {
      setOtpError("Enter the OTP to continue");
      return;
    }

    setOtpError("");
    dispatch(verify_login_otp({ otp: normalizedOtp }));
  };
  const resendOtp = () => {
    if (resendCooldown > 0) return;
    dispatch(retry_login_otp());
  };
  const changeCredentials = () => {
    setOtp("");
    setOtpError("");
    dispatch(clearOtpChallenge());
  };
  const overrideStyle = {
    display: "flex",
    margin: "0 auto",
    height: "24px",
    justifyContent: "center",
    alignItems: "center",
  };
  useEffect(() => {
    setResendCooldown(otpResendCooldownSeconds || 0);
  }, [otpResendCooldownSeconds]);
  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = setInterval(() => {
      setResendCooldown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      navigate("/");
    }
  }, [errorMessage, successMessage]);
  return (
    <div className="min-w-screen min-h-screen bg-[#161d31] flex justify-center items-center">
      <div className="w-[350px] text-[#d0d2d6] p-2">
        <div className="bg-[#283046] p-4 rounded-md">
          <div className="h-[120px] flex justify-center items-center">
            <div className="w-full h-[100px]">
              <img
                className="w-full h-full"
                src="/images/logo.png"
                alt="image"
              />
            </div>
          </div>
          {!otpRequired ? (
          <form onSubmit={submit}>
            <div className="flex flex-col w-full gap-1 mb-3">
              <label htmlFor="email">Email</label>
              <input
                onChange={inputHandle}
                value={state.email}
                className="px-3 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500 overflow-hidden"
                type="text"
                name="email"
                placeholder="email"
                id="email"
                required
              />
            </div>
            <div className="flex flex-col w-full gap-1 mb-5">
              <label htmlFor="password">Password</label>
              <div className="relative">
                <input
                  onChange={inputHandle}
                  value={state.password}
                  className="w-full px-3 py-2 pr-10 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500 overflow-hidden"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  autoComplete="current-password"
                  placeholder="password"
                  id="password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <button
              disabled={loader ? true : false}
              className="bg-blue-500 w-full hover:shadow-blue-500/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
            >
              {loader ? (
                <PropagateLoader color="#fff" cssOverride={overrideStyle} />
              ) : (
                "Login"
              )}
            </button>
          </form>
          ) : (
            <form onSubmit={submitOtp}>
              <div className="mb-4 rounded-md border border-slate-700 bg-[#222b40] p-3 text-sm">
                OTP sent to{" "}
                <span className="font-semibold text-white">
                  {otpMaskedIdentifier || "your registered contact"}
                </span>
              </div>

              <div className="flex flex-col w-full gap-1 mb-3">
                <label htmlFor="adminOtp">OTP</label>
                <input
                  id="adminOtp"
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setOtpError("");
                  }}
                  value={otp}
                  className="px-3 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500 overflow-hidden"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={8}
                  placeholder="Enter OTP"
                  required
                />
              </div>

              {otpError ? (
                <div className="mb-4 rounded-md border border-amber-400 bg-amber-100 p-3 text-sm text-amber-900">
                  {otpError}
                </div>
              ) : null}

              <button
                disabled={loader ? true : false}
                className="bg-blue-500 w-full hover:shadow-blue-500/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3"
              >
                {loader ? (
                  <PropagateLoader color="#fff" cssOverride={overrideStyle} />
                ) : (
                  "Verify OTP"
                )}
              </button>

              <button
                type="button"
                onClick={resendOtp}
                disabled={loader || resendCooldown > 0}
                className="w-full rounded-md border border-slate-700 px-7 py-2 mb-3 font-semibold text-[#d0d2d6] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
              </button>

              <button
                type="button"
                onClick={changeCredentials}
                className="w-full text-sm font-semibold text-blue-400"
              >
                Change login details
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
