import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AiOutlineGooglePlus, AiOutlineGithub } from 'react-icons/ai'
import { FiFacebook } from 'react-icons/fi'
import { CiTwitter } from 'react-icons/ci'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { PropagateLoader } from 'react-spinners'
import { useDispatch, useSelector } from 'react-redux'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/style.css'

import { overrideStyle } from '../../utils/utils'
import {
    clearSignupOtpChallenge,
    messageClear,
    retry_signup_otp,
    seller_register,
    verify_signup_otp
} from '../../store/Reducers/authReducer'

const Register = () => {

    const navigate = useNavigate()
    const dispatch = useDispatch()

    const {
        loader,
        errorMessage,
        successMessage,
        signupOtpRequired,
        signupOtpMaskedIdentifier,
        signupOtpResendCooldownSeconds
    } = useSelector(state => state.auth)

    // Keeping original setter name to avoid breaking your project
    const [state, setSatate] = useState({
        name: '',
        email: '',
        password: '',
        mobile: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [otp, setOtp] = useState('')
    const [otpError, setOtpError] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)

    const inputHandle = (e) => {
        setSatate({
            ...state,
            [e.target.name]: e.target.value
        })
    }

    const submit = (e) => {
        e.preventDefault()

        if (!state.mobile || state.mobile.length < 8) {
            return toast.error('Please enter valid mobile number')
        }

        dispatch(seller_register({
            ...state,
            mobile: '+' + state.mobile
        }))
    }

    const verifyOtp = (e) => {
        e.preventDefault()
        const normalizedOtp = otp.replace(/\D/g, '')

        if (!normalizedOtp) {
            setOtpError('Enter the OTP to continue')
            return
        }

        setOtpError('')
        dispatch(verify_signup_otp({ otp: normalizedOtp }))
    }

    const resendOtp = () => {
        if (resendCooldown > 0) return
        dispatch(retry_signup_otp())
    }

    const changeDetails = () => {
        setOtp('')
        setOtpError('')
        dispatch(clearSignupOtpChallenge())
    }

    useEffect(() => {
        setResendCooldown(signupOtpResendCooldownSeconds || 0)
    }, [signupOtpResendCooldownSeconds])

    useEffect(() => {
        if (resendCooldown <= 0) return undefined
        const timer = setInterval(() => {
            setResendCooldown((current) => (current > 0 ? current - 1 : 0))
        }, 1000)

        return () => clearInterval(timer)
    }, [resendCooldown])

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear())
            if (!signupOtpRequired) {
                navigate('/seller/login')
            }
        }

        if (errorMessage) {
            toast.error(errorMessage)
            dispatch(messageClear())
        }
    }, [successMessage, errorMessage, signupOtpRequired, dispatch, navigate])

    return (
        <div className='min-w-screen min-h-screen bg-[#161d31] flex justify-center items-center'>
            <div className='w-[380px] text-[#d0d2d6] p-2'>
                <div className='bg-[#283046] p-5 rounded-md'>
                    <h2 className='text-xl mb-2 font-semibold'>Welcome to e-commerce</h2>
                    <p className='text-sm mb-4'>Register your account and start your business</p>

                    {!signupOtpRequired ? (
                    <form onSubmit={submit}>

                        {/* Name */}
                        <div className='flex flex-col w-full gap-1 mb-3'>
                            <label>Name</label>
                            <input
                                onChange={inputHandle}
                                value={state.name}
                                type="text"
                                name='name'
                                required
                                placeholder='Enter your name'
                                className='px-3 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                            />
                        </div>

                        {/* Email */}
                        <div className='flex flex-col w-full gap-1 mb-3'>
                            <label>Email</label>
                            <input
                                onChange={inputHandle}
                                value={state.email}
                                type="email"
                                name='email'
                                required
                                placeholder='Enter your email'
                                className='px-3 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                            />
                        </div>

                        {/* Mobile Number */}
                        <div className='flex flex-col w-full gap-1 mb-3'>
                            <label>Mobile Number</label>

                            <PhoneInput
                                country={'in'}
                                value={state.mobile}
                                onChange={(phone) =>
                                    setSatate({ ...state, mobile: phone })
                                }
                                enableSearch={true}
                                inputStyle={{
                                    width: '100%',
                                    background: 'transparent',
                                    border: '1px solid #334155',
                                    color: '#d0d2d6',
                                    height: '42px'
                                }}
                                buttonStyle={{
                                    background: '#283046',
                                    border: '1px solid #334155'
                                }}
                                containerStyle={{ width: '100%' }}
                            />
                        </div>

                        {/* Password */}
                        <div className='flex flex-col w-full gap-1 mb-3'>
                            <label>Password</label>
                            <div className='relative'>
                                <input
                                    onChange={inputHandle}
                                    value={state.password}
                                    type={showPassword ? 'text' : 'password'}
                                    name='password'
                                    autoComplete='new-password'
                                    required
                                    placeholder='Enter your password'
                                    className='w-full px-3 py-2 pr-10 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200'
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className='flex items-center w-full gap-3 mb-3'>
                            <input type="checkbox" required />
                            <label>I agree to privacy policy & terms</label>
                        </div>

                        {/* Submit */}
                        <button
                            disabled={loader}
                            className='bg-blue-500 w-full hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3'
                        >
                            {
                                loader
                                    ? <PropagateLoader color='#fff' cssOverride={overrideStyle} />
                                    : 'Signup'
                            }
                        </button>

                        {/* Login */}
                        <div className='flex justify-center mb-3'>
                            <p>
                                Already have an account?
                                <Link to='/seller/login' className='text-blue-400 ml-1'>Signin here</Link>
                            </p>
                        </div>

                        {/* Divider */}
                        <div className='w-full flex justify-center items-center mb-3'>
                            <div className='w-[45%] bg-slate-700 h-[1px]' />
                            <div className='w-[10%] text-center'>Or</div>
                            <div className='w-[45%] bg-slate-700 h-[1px]' />
                        </div>

                        {/* Social Icons */}
                        <div className='flex justify-center items-center gap-3'>
                            <div className='w-[35px] h-[35px] flex rounded-md bg-orange-700 justify-center items-center cursor-pointer'>
                                <AiOutlineGooglePlus />
                            </div>
                            <div className='w-[35px] h-[35px] flex rounded-md bg-indigo-700 justify-center items-center cursor-pointer'>
                                <FiFacebook />
                            </div>
                            <div className='w-[35px] h-[35px] flex rounded-md bg-cyan-700 justify-center items-center cursor-pointer'>
                                <CiTwitter />
                            </div>
                            <div className='w-[35px] h-[35px] flex rounded-md bg-purple-700 justify-center items-center cursor-pointer'>
                                <AiOutlineGithub />
                            </div>
                        </div>
                    </form>
                    ) : (
                        <form onSubmit={verifyOtp}>
                            <div className='mb-4 rounded-md border border-slate-700 bg-[#222b40] p-3 text-sm'>
                                OTP sent to <span className='font-semibold text-white'>{signupOtpMaskedIdentifier || 'your mobile number'}</span>
                            </div>

                            <div className='flex flex-col w-full gap-1 mb-3'>
                                <label htmlFor='sellerSignupOtp'>OTP</label>
                                <input
                                    id='sellerSignupOtp'
                                    value={otp}
                                    onChange={(e) => {
                                        setOtp(e.target.value.replace(/\D/g, ''))
                                        setOtpError('')
                                    }}
                                    type='text'
                                    inputMode='numeric'
                                    autoComplete='one-time-code'
                                    maxLength={8}
                                    required
                                    placeholder='Enter OTP'
                                    className='w-full px-3 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                />
                            </div>

                            {otpError ? (
                                <div className='mb-4 rounded-md border border-amber-400 bg-amber-100 p-3 text-sm text-amber-900'>
                                    {otpError}
                                </div>
                            ) : null}

                            <button
                                disabled={loader}
                                className='bg-blue-500 w-full hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3'
                            >
                                {
                                    loader
                                        ? <PropagateLoader color='#fff' cssOverride={overrideStyle} />
                                        : 'Verify & Create Account'
                                }
                            </button>

                            <button
                                type='button'
                                onClick={resendOtp}
                                disabled={loader || resendCooldown > 0}
                                className='w-full rounded-md border border-slate-700 px-7 py-2 mb-3 font-semibold text-[#d0d2d6] disabled:cursor-not-allowed disabled:opacity-60'
                            >
                                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                            </button>

                            <button
                                type='button'
                                onClick={changeDetails}
                                className='w-full text-sm font-semibold text-blue-400'
                            >
                                Change signup details
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Register
