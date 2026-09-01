import React, { useEffect, useState } from 'react'
import { BsImages } from 'react-icons/bs'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import { FadeLoader, PropagateLoader } from 'react-spinners'
import toast from 'react-hot-toast'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { overrideStyle } from '../../utils/utils'
import {
    admin_update_profile,
    admin_change_password,
    create_admin,
    messageClear,
    resetAuthState,
    update_admin_username
} from '../../store/Reducers/authReducer'

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

const AdminAccount = () => {
    const dispatch = useDispatch()
    const navigate = useNavigate()
    const { userInfo, loader, passwordLoader, successMessage, errorMessage } = useSelector((state) => state.auth)

    const [actionType, setActionType] = useState('')
    const [usernameState, setUsernameState] = useState({
        name: ''
    })
    const [passwordState, setPasswordState] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })
    const [createAdminState, setCreateAdminState] = useState({
        name: '',
        email: '',
        mobile: '',
        password: '',
        role: 'admin'
    })
    const [showCurrentPassword, setShowCurrentPassword] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [showCreatePassword, setShowCreatePassword] = useState(false)

    useEffect(() => {
        setUsernameState({
            name: userInfo?.name || ''
        })
    }, [userInfo])

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage)
            dispatch(messageClear())
            setActionType('')
        }

        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear())

            if (actionType === 'password') {
                dispatch(resetAuthState())
                navigate('/admin/login')
                return
            }

            if (actionType === 'create') {
                setCreateAdminState({
                    name: '',
                    email: '',
                    mobile: '',
                    password: '',
                    role: 'admin'
                })
                setShowCreatePassword(false)
            }

            if (actionType === 'username') {
                setUsernameState({
                    name: userInfo?.name || ''
                })
            }

            setPasswordState({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            })
            setShowCurrentPassword(false)
            setShowNewPassword(false)
            setShowConfirmPassword(false)
            setActionType('')
        }
    }, [successMessage, errorMessage, actionType, dispatch, navigate, userInfo])

    const passwordInputHandle = (e) => {
        setPasswordState({
            ...passwordState,
            [e.target.name]: e.target.value
        })
    }

    const usernameInputHandle = (e) => {
        setUsernameState({
            ...usernameState,
            [e.target.name]: e.target.value
        })
    }

    const createAdminInputHandle = (e) => {
        setCreateAdminState({
            ...createAdminState,
            [e.target.name]: e.target.value
        })
    }

    const addImage = (e) => {
        if (e.target.files?.length > 0) {
            const formData = new FormData()
            formData.append('image', e.target.files[0])
            setActionType('profile')
            dispatch(admin_update_profile(formData))
        }
    }

    const submitPasswordChange = (e) => {
        e.preventDefault()

        if (!passwordRegex.test(passwordState.newPassword)) {
            toast.error('Password must be at least 8 characters and include uppercase, lowercase, number and special character')
            return
        }

        if (passwordState.newPassword !== passwordState.confirmPassword) {
            toast.error('New password and confirm password do not match')
            return
        }

        setActionType('password')
        dispatch(admin_change_password(passwordState))
    }

    const submitUsernameUpdate = (e) => {
        e.preventDefault()
        setActionType('username')
        dispatch(update_admin_username(usernameState))
    }

    const submitCreateAdmin = (e) => {
        e.preventDefault()

        if (!passwordRegex.test(createAdminState.password)) {
            toast.error('Password must be at least 8 characters and include uppercase, lowercase, number and special character')
            return
        }

        setActionType('create')
        dispatch(create_admin(createAdminState))
    }

    return (
        <div className='px-2 lg:px-7 py-5'>
            <div className='mb-6'>
                <h1 className='text-2xl font-semibold text-[#d0d2d6]'>Admin Security</h1>
                <p className='text-sm text-slate-400 mt-1'>Manage your admin account, password, and admin creation privileges.</p>
            </div>

            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6'>
                <div className='bg-[#283046] rounded-md p-4 text-[#d0d2d6] xl:col-span-2'>
                    <div className='flex flex-col lg:flex-row gap-6 items-start lg:items-center'>
                        <div className='flex justify-center items-center'>
                            {
                                userInfo?.image ? (
                                    <label htmlFor='admin-profile-image' className='h-[210px] w-[300px] relative p-3 cursor-pointer overflow-hidden rounded-md'>
                                        <img className='w-full h-full object-cover rounded-md' src={userInfo.image} alt='admin profile' />
                                        {
                                            loader && actionType === 'profile' && (
                                                <div className='bg-slate-600 absolute left-0 top-0 w-full h-full opacity-70 flex justify-center items-center z-20'>
                                                    <span>
                                                        <FadeLoader />
                                                    </span>
                                                </div>
                                            )
                                        }
                                    </label>
                                ) : (
                                    <label
                                        className='flex justify-center items-center flex-col h-[210px] w-[300px] cursor-pointer border border-dashed hover:border-indigo-500 border-[#d0d2d6] relative rounded-md'
                                        htmlFor='admin-profile-image'
                                    >
                                        <span><BsImages /></span>
                                        <span>Select Profile Image</span>
                                        {
                                            loader && actionType === 'profile' && (
                                                <div className='bg-slate-600 absolute left-0 top-0 w-full h-full opacity-70 flex justify-center items-center z-20 rounded-md'>
                                                    <span>
                                                        <FadeLoader />
                                                    </span>
                                                </div>
                                            )
                                        }
                                    </label>
                                )
                            }
                            <input onChange={addImage} type='file' accept='image/*' className='hidden' id='admin-profile-image' />
                        </div>

                        <div className='flex-1 w-full'>
                            <h2 className='text-lg font-semibold mb-2'>Profile Photo</h2>
                            <p className='text-sm text-slate-400 mb-4'>Update your admin profile picture without affecting any other account settings.</p>
                            <div className='rounded-md border border-slate-700 bg-[#1f2d44] px-4 py-4 text-sm text-slate-300 space-y-2'>
                                <div className='flex flex-wrap gap-2'>
                                    <span className='text-slate-400'>Username:</span>
                                    <span className='text-[#d0d2d6]'>{userInfo?.name}</span>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    <span className='text-slate-400'>Email:</span>
                                    <span className='text-[#d0d2d6]'>{userInfo?.email}</span>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    <span className='text-slate-400'>Mobile:</span>
                                    <span className='text-[#d0d2d6]'>{userInfo?.mobile || 'Not set'}</span>
                                </div>
                                <div className='flex flex-wrap gap-2'>
                                    <span className='text-slate-400'>Admin role:</span>
                                    <span className='text-[#d0d2d6] capitalize'>{userInfo?.adminRole || 'admin'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='bg-[#283046] rounded-md p-4 text-[#d0d2d6]'>
                    <h2 className='text-lg font-semibold mb-3'>Change Password</h2>
                    <form onSubmit={submitPasswordChange} className='space-y-4'>
                        <div className='flex flex-col gap-1'>
                            <label htmlFor='currentPassword'>Current Password</label>
                            <div className='relative'>
                                <input
                                    id='currentPassword'
                                    name='currentPassword'
                                    type={showCurrentPassword ? 'text' : 'password'}
                                    autoComplete='current-password'
                                    value={passwordState.currentPassword}
                                    onChange={passwordInputHandle}
                                    className='w-full px-4 py-2 pr-10 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                    placeholder='Current password'
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200'
                                    aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                                >
                                    {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <div className='flex flex-col gap-1'>
                            <label htmlFor='newPassword'>New Password</label>
                            <div className='relative'>
                                <input
                                    id='newPassword'
                                    name='newPassword'
                                    type={showNewPassword ? 'text' : 'password'}
                                    autoComplete='new-password'
                                    value={passwordState.newPassword}
                                    onChange={passwordInputHandle}
                                    className='w-full px-4 py-2 pr-10 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                    placeholder='New password'
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowNewPassword((prev) => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200'
                                    aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                                >
                                    {showNewPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <div className='flex flex-col gap-1'>
                            <label htmlFor='confirmPassword'>Confirm New Password</label>
                            <div className='relative'>
                                <input
                                    id='confirmPassword'
                                    name='confirmPassword'
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete='new-password'
                                    value={passwordState.confirmPassword}
                                    onChange={passwordInputHandle}
                                    className='w-full px-4 py-2 pr-10 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                    placeholder='Confirm new password'
                                    required
                                />
                                <button
                                    type='button'
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200'
                                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                                >
                                    {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                                </button>
                            </div>
                        </div>

                        <p className='text-xs text-slate-400'>Use at least 8 characters with uppercase, lowercase, number and special character.</p>

                        <button disabled={passwordLoader} className='bg-blue-500 hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 min-w-[200px]'>
                            {
                                passwordLoader ? <PropagateLoader color='#fff' cssOverride={overrideStyle} /> : 'Update Password'
                            }
                        </button>
                    </form>
                </div>

                <div className='bg-[#283046] rounded-md p-4 text-[#d0d2d6]'>
                    <h2 className='text-lg font-semibold mb-3'>Update Username</h2>
                    <form onSubmit={submitUsernameUpdate} className='space-y-4'>
                        <div className='flex flex-col gap-1'>
                            <label htmlFor='name'>Username</label>
                            <input
                                id='name'
                                name='name'
                                value={usernameState.name}
                                onChange={usernameInputHandle}
                                className='w-full px-4 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                placeholder='Admin username'
                                required
                            />
                        </div>

                        <div className='rounded-md border border-slate-700 bg-[#1f2d44] px-4 py-3 text-sm text-slate-300'>
                            Email: <span className='text-[#d0d2d6]'>{userInfo?.email}</span>
                        </div>

                        <button disabled={loader} className='bg-green-500 hover:shadow-green-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 min-w-[200px]'>
                            {
                                loader && actionType === 'username' ? <PropagateLoader color='#fff' cssOverride={overrideStyle} /> : 'Update Username'
                            }
                        </button>
                    </form>
                </div>

                <div className='bg-[#283046] rounded-md p-4 text-[#d0d2d6] xl:col-span-2'>
                    <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4'>
                        <div>
                            <h2 className='text-lg font-semibold'>Create New Admin</h2>
                            <p className='text-sm text-slate-400'>Only super admin can create additional admin accounts.</p>
                        </div>
                        <span className='text-sm px-3 py-1 rounded-full bg-slate-800 text-slate-300 capitalize'>
                            Your admin role: {userInfo?.adminRole || 'admin'}
                        </span>
                    </div>

                    {
                        userInfo?.adminRole === 'super_admin' ? (
                            <form onSubmit={submitCreateAdmin} className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='adminName'>Username</label>
                                    <input
                                        id='adminName'
                                        name='name'
                                        value={createAdminState.name}
                                        onChange={createAdminInputHandle}
                                        className='w-full px-4 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                        placeholder='Admin username'
                                        required
                                    />
                                </div>

                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='adminEmail'>Email</label>
                                    <input
                                        id='adminEmail'
                                        name='email'
                                        type='email'
                                        value={createAdminState.email}
                                        onChange={createAdminInputHandle}
                                        className='w-full px-4 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                        placeholder='Admin email'
                                        required
                                    />
                                </div>

                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='adminMobile'>Mobile Number</label>
                                    <input
                                        id='adminMobile'
                                        name='mobile'
                                        type='tel'
                                        value={createAdminState.mobile}
                                        onChange={createAdminInputHandle}
                                        className='w-full px-4 py-2 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                        placeholder='+919876543210'
                                        required
                                    />
                                </div>

                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='adminPassword'>Password</label>
                                    <div className='relative'>
                                        <input
                                            id='adminPassword'
                                            name='password'
                                            type={showCreatePassword ? 'text' : 'password'}
                                            value={createAdminState.password}
                                            onChange={createAdminInputHandle}
                                            className='w-full px-4 py-2 pr-10 outline-none border border-slate-700 bg-transparent rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                            placeholder='Strong password'
                                            required
                                        />
                                        <button
                                            type='button'
                                            onClick={() => setShowCreatePassword((prev) => !prev)}
                                            className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200'
                                            aria-label={showCreatePassword ? 'Hide admin password' : 'Show admin password'}
                                        >
                                            {showCreatePassword ? <FiEyeOff /> : <FiEye />}
                                        </button>
                                    </div>
                                </div>

                                <div className='flex flex-col gap-1'>
                                    <label htmlFor='adminRole'>Role</label>
                                    <select
                                        id='adminRole'
                                        name='role'
                                        value={createAdminState.role}
                                        onChange={createAdminInputHandle}
                                        className='w-full px-4 py-2 outline-none border border-slate-700 bg-[#283046] rounded-md text-[#d0d2d6] focus:border-indigo-500'
                                    >
                                        <option value='admin'>Admin</option>
                                        <option value='super_admin'>Super Admin</option>
                                    </select>
                                </div>

                                <div className='md:col-span-2'>
                                    <p className='text-xs text-slate-400 mb-4'>Password must include uppercase, lowercase, number and special character.</p>
                                    <button disabled={loader} className='bg-indigo-500 hover:shadow-indigo-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 min-w-[200px]'>
                                        {
                                            loader && actionType === 'create' ? <PropagateLoader color='#fff' cssOverride={overrideStyle} /> : 'Create Admin'
                                        }
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className='rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-200'>
                                Only super admin can access admin creation controls.
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}

export default AdminAccount
