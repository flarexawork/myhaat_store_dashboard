import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import jwt from 'jwt-decode'
import axios from 'axios'
import { api_url } from '../../utils/utils'

const normalizeAccountStatus = (payload = {}) => {
    const explicitStatus = payload.accountStatus || payload.userInfo?.accountStatus
    const sellerStatus = payload.userInfo?.status

    if (explicitStatus) {
        return explicitStatus
    }

    if (sellerStatus === 'deactive') {
        return 'inactive'
    }

    return sellerStatus || ''
}

const normalizeAdminRemark = (payload = {}) => {
    return payload.adminRemark || payload.userInfo?.adminRemark || ''
}

const normalizeRestrictedState = (payload = {}) => {
    return Boolean(
        payload.restricted ||
        payload.userInfo?.isRestricted ||
        normalizeAccountStatus(payload) === 'inactive' ||
        payload.userInfo?.verificationStatus === 'rejected'
    )
}

export const admin_login = createAsyncThunk(
    'auth/admin_login',
    async (info, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await axios.post(`${api_url}/api/admin-login`, info)
            if (data?.requiresOtp) {
                return fulfillWithValue(data)
            }
            localStorage.setItem('accessToken', data.token)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const seller_login = createAsyncThunk(
    'auth/seller_login',
    async (info, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await axios.post(`${api_url}/api/seller-login`, info, { withCredentials: true })
            if (data?.requiresOtp) {
                return fulfillWithValue(data)
            }
            localStorage.setItem('accessToken', data.token)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const verify_login_otp = createAsyncThunk(
    'auth/verify_login_otp',
    async ({ otp }, { rejectWithValue, fulfillWithValue, getState }) => {
        try {
            const { otpChallengeToken, otpRole } = getState().auth
            const { data } = await axios.post(`${api_url}/api/auth/login-otp/verify`, {
                challengeToken: otpChallengeToken,
                otp,
                role: otpRole
            }, { withCredentials: true })
            if (data?.requiresOtp) {
                return rejectWithValue({ message: 'OTP verification is still required.' })
            }
            localStorage.setItem('accessToken', data.token)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Unable to verify OTP' })
        }
    }
)

export const retry_login_otp = createAsyncThunk(
    'auth/retry_login_otp',
    async (_, { rejectWithValue, fulfillWithValue, getState }) => {
        try {
            const { otpChallengeToken, otpRole } = getState().auth
            const { data } = await axios.post(`${api_url}/api/auth/login-otp/retry`, {
                challengeToken: otpChallengeToken,
                role: otpRole
            })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Unable to resend OTP' })
        }
    }
)

export const complete_seller_verification = createAsyncThunk(
    'auth/complete_seller_verification',
    async (formData, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token

        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.post(
                `${api_url}/api/seller/complete-verification`,
                formData,
                config
            )
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)
export const logout = createAsyncThunk(
    'auth/logout',
    async ({ navigate, role }, { rejectWithValue }) => {
        try {
            //const { data } = await axios.get('/logout', { withCredentials: true })
            localStorage.removeItem('accessToken')
            if (role === 'admin') {
                navigate('/admin/login')
            } else {
                navigate('/login')
            }
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)


export const seller_register = createAsyncThunk(
    'auth/seller_register',
    async (info, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await axios.post(`${api_url}/api/seller-register`, info, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const verify_signup_otp = createAsyncThunk(
    'auth/verify_signup_otp',
    async ({ otp }, { rejectWithValue, fulfillWithValue, getState }) => {
        try {
            const { signupOtpChallengeToken } = getState().auth
            const { data } = await axios.post(`${api_url}/api/auth/signup-otp/verify`, {
                challengeToken: signupOtpChallengeToken,
                role: 'seller',
                otp
            })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Unable to verify signup OTP' })
        }
    }
)

export const retry_signup_otp = createAsyncThunk(
    'auth/retry_signup_otp',
    async (_, { rejectWithValue, fulfillWithValue, getState }) => {
        try {
            const { signupOtpChallengeToken } = getState().auth
            const { data } = await axios.post(`${api_url}/api/auth/signup-otp/retry`, {
                challengeToken: signupOtpChallengeToken,
                role: 'seller'
            })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response?.data || { message: 'Unable to resend OTP' })
        }
    }
)


export const profile_image_upload = createAsyncThunk(
    'auth/profile_image_upload',
    async (image, { rejectWithValue, fulfillWithValue, getState }) => {

        const token = getState().auth.token
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.post(`${api_url}/api/profile-image-upload`, image, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const profile_info_add = createAsyncThunk(
    'auth/profile_info_add',
    async (info, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
        try {
            const { data } = await axios.post(`${api_url}/api/profile-info-add`, info, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const seller_change_password = createAsyncThunk(
    'auth/seller_change_password',
    async (info, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.put(`${api_url}/api/seller/change-password`, info, config)
            localStorage.removeItem('accessToken')
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const admin_change_password = createAsyncThunk(
    'auth/admin_change_password',
    async (info, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.put(`${api_url}/api/admin/change-password`, info, config)
            localStorage.removeItem('accessToken')
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const admin_update_profile = createAsyncThunk(
    'auth/admin_update_profile',
    async (image, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.put(`${api_url}/api/admin/update-profile`, image, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const create_admin = createAsyncThunk(
    'auth/create_admin',
    async (info, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.post(`${api_url}/api/admin/create`, info, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const update_admin_username = createAsyncThunk(
    'auth/update_admin_username',
    async (info, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }

        try {
            const { data } = await axios.put(`${api_url}/api/admin/update-username`, info, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)




export const get_user_info = createAsyncThunk(
    'auth/get_user_info',
    async (_, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
        try {
            const { data } = await axios.get(`${api_url}/api/get-user`, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

const returnRole = (token) => {
    if (token) {
        const decodeToken = jwt(token)
        const expireTime = new Date(decodeToken.exp * 1000)
        if (new Date() > expireTime) {
            localStorage.removeItem('accessToken')
            return ''
        } else {
            return decodeToken.role
        }
    } else {
        return ''
    }
}


export const authReducer = createSlice({
    name: 'auth',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        passwordLoader: false,
        userInfo: '',
        verificationStatus: '',
        accountStatus: '',
        adminRemark: '',
        restricted: false,
        requiresVerification: false,
        waitingApproval: false,
        otpRequired: false,
        otpChallengeToken: '',
        otpMaskedIdentifier: '',
        otpRole: '',
        otpExpiresInSeconds: 0,
        otpResendCooldownSeconds: 0,
        signupOtpRequired: false,
        signupOtpChallengeToken: '',
        signupOtpMaskedIdentifier: '',
        signupOtpResendCooldownSeconds: 0,
        role: returnRole(localStorage.getItem('accessToken')),
        token: localStorage.getItem('accessToken')
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        },
        resetAuthState: (state, _) => {
            localStorage.removeItem('accessToken')
            state.successMessage = ''
            state.errorMessage = ''
            state.loader = false
            state.passwordLoader = false
            state.userInfo = ''
            state.verificationStatus = ''
            state.accountStatus = ''
            state.adminRemark = ''
            state.restricted = false
            state.requiresVerification = false
            state.waitingApproval = false
            state.otpRequired = false
            state.otpChallengeToken = ''
            state.otpMaskedIdentifier = ''
            state.otpRole = ''
            state.otpExpiresInSeconds = 0
            state.otpResendCooldownSeconds = 0
            state.signupOtpRequired = false
            state.signupOtpChallengeToken = ''
            state.signupOtpMaskedIdentifier = ''
            state.signupOtpResendCooldownSeconds = 0
            state.role = ''
            state.token = ''
        },
        clearOtpChallenge: (state, _) => {
            state.otpRequired = false
            state.otpChallengeToken = ''
            state.otpMaskedIdentifier = ''
            state.otpRole = ''
            state.otpExpiresInSeconds = 0
            state.otpResendCooldownSeconds = 0
        },
        clearSignupOtpChallenge: (state, _) => {
            state.signupOtpRequired = false
            state.signupOtpChallengeToken = ''
            state.signupOtpMaskedIdentifier = ''
            state.signupOtpResendCooldownSeconds = 0
        }
    },
    extraReducers: {
        [admin_login.pending]: (state, _) => {
            state.loader = true
        },
        [admin_login.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload.error
        },
        [admin_login.fulfilled]: (state, { payload }) => {
            state.loader = false
            if (payload.requiresOtp) {
                state.otpRequired = true
                state.otpChallengeToken = payload.challengeToken || ''
                state.otpMaskedIdentifier = payload.maskedIdentifier || ''
                state.otpRole = payload.role || 'admin'
                state.otpExpiresInSeconds = payload.expiresInSeconds || 0
                state.otpResendCooldownSeconds = payload.resendCooldownSeconds || 0
                state.token = ''
                state.role = ''
                return
            }
            state.successMessage = payload.message
            state.token = payload.token
            state.role = returnRole(payload.token)
            state.otpRequired = false
            state.otpChallengeToken = ''
            state.otpMaskedIdentifier = ''
            state.otpRole = ''
        },
        [seller_login.pending]: (state, _) => {
            state.loader = true
            state.errorMessage = ''
        },
        [seller_login.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Login failed'
        },
        [seller_login.fulfilled]: (state, { payload }) => {
            state.loader = false
            if (payload.requiresOtp) {
                state.otpRequired = true
                state.otpChallengeToken = payload.challengeToken || ''
                state.otpMaskedIdentifier = payload.maskedIdentifier || ''
                state.otpRole = payload.role || 'seller'
                state.otpExpiresInSeconds = payload.expiresInSeconds || 0
                state.otpResendCooldownSeconds = payload.resendCooldownSeconds || 0
                state.token = ''
                state.role = ''
                return
            }
            state.successMessage = payload.message
            state.token = payload.token
            state.role = returnRole(payload.token)
            state.verificationStatus = payload.verificationStatus || ''
            state.accountStatus = normalizeAccountStatus(payload)
            state.adminRemark = normalizeAdminRemark(payload)
            state.restricted = normalizeRestrictedState(payload)
            state.requiresVerification = Boolean(payload.requiresVerification)
            state.waitingApproval = Boolean(payload.waitingApproval)
            state.otpRequired = false
            state.otpChallengeToken = ''
            state.otpMaskedIdentifier = ''
            state.otpRole = ''
        },
        [verify_login_otp.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [verify_login_otp.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to verify OTP'
        },
        [verify_login_otp.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload.message || 'Login success'
            state.token = payload.token
            state.role = returnRole(payload.token)
            state.verificationStatus = payload.verificationStatus || ''
            state.accountStatus = normalizeAccountStatus(payload)
            state.adminRemark = normalizeAdminRemark(payload)
            state.restricted = normalizeRestrictedState(payload)
            state.requiresVerification = Boolean(payload.requiresVerification)
            state.waitingApproval = Boolean(payload.waitingApproval)
            state.otpRequired = false
            state.otpChallengeToken = ''
            state.otpMaskedIdentifier = ''
            state.otpRole = ''
            state.otpExpiresInSeconds = 0
            state.otpResendCooldownSeconds = 0
        },
        [retry_login_otp.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [retry_login_otp.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to resend OTP'
        },
        [retry_login_otp.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload?.message || 'OTP resent successfully'
            state.otpMaskedIdentifier = payload?.maskedIdentifier || state.otpMaskedIdentifier
            state.otpResendCooldownSeconds = payload?.resendCooldownSeconds || state.otpResendCooldownSeconds
        },
        [seller_register.pending]: (state, _) => {
            state.loader = true
        },
        [seller_register.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Registration failed'
        },
        [seller_register.fulfilled]: (state, { payload }) => {
            state.loader = false
            if (payload?.requiresOtp) {
                state.successMessage = payload?.message || 'OTP sent successfully'
                state.signupOtpRequired = true
                state.signupOtpChallengeToken = payload.challengeToken || ''
                state.signupOtpMaskedIdentifier = payload.maskedIdentifier || ''
                state.signupOtpResendCooldownSeconds = payload.resendCooldownSeconds || 0
                return
            }
            state.successMessage = payload?.message || 'Registration successful. Please verify your email.'
        },
        [verify_signup_otp.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [verify_signup_otp.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to verify signup OTP'
        },
        [verify_signup_otp.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload?.message || 'Signup verified successfully. Please login.'
            state.signupOtpRequired = false
            state.signupOtpChallengeToken = ''
            state.signupOtpMaskedIdentifier = ''
            state.signupOtpResendCooldownSeconds = 0
        },
        [retry_signup_otp.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [retry_signup_otp.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to resend OTP'
        },
        [retry_signup_otp.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload?.message || 'OTP resent successfully'
            state.signupOtpMaskedIdentifier = payload?.maskedIdentifier || state.signupOtpMaskedIdentifier
            state.signupOtpResendCooldownSeconds = payload?.resendCooldownSeconds || state.signupOtpResendCooldownSeconds
        },
        [get_user_info.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.userInfo = payload.userInfo
            state.role = payload.userInfo.role
            state.verificationStatus = payload.verificationStatus || payload.userInfo?.verificationStatus || ''
            state.accountStatus = normalizeAccountStatus(payload)
            state.adminRemark = normalizeAdminRemark(payload)
            state.restricted = normalizeRestrictedState(payload)
            state.requiresVerification = Boolean(payload.requiresVerification)
            state.waitingApproval = Boolean(payload.waitingApproval)
        },
        [profile_image_upload.pending]: (state, _) => {
            state.loader = true
        },
        [profile_image_upload.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.userInfo = payload.userInfo
            state.successMessage = payload.message
            state.verificationStatus = payload.userInfo?.verificationStatus || state.verificationStatus
            state.accountStatus = normalizeAccountStatus(payload)
            state.adminRemark = normalizeAdminRemark(payload)
            state.restricted = normalizeRestrictedState(payload)
        },
        [profile_info_add.pending]: (state, _) => {
            state.loader = true
        },
        [profile_info_add.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.userInfo = payload.userInfo
            state.successMessage = payload.message
            state.verificationStatus = payload.userInfo?.verificationStatus || state.verificationStatus
            state.accountStatus = normalizeAccountStatus(payload)
            state.adminRemark = normalizeAdminRemark(payload)
            state.restricted = normalizeRestrictedState(payload)
        },
        [complete_seller_verification.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [complete_seller_verification.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Verification submission failed'
        },
        [complete_seller_verification.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.userInfo = payload.seller
            state.successMessage = payload.message
            state.verificationStatus = payload.seller?.verificationStatus || 'pending_admin'
            state.accountStatus = normalizeAccountStatus(payload)
            state.adminRemark = ''
            state.restricted = false
            state.requiresVerification = false
            state.waitingApproval = true
        },
        [seller_change_password.pending]: (state) => {
            state.passwordLoader = true
            state.errorMessage = ''
        },
        [seller_change_password.rejected]: (state, { payload }) => {
            state.passwordLoader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to change password'
        },
        [seller_change_password.fulfilled]: (state, { payload }) => {
            state.passwordLoader = false
            state.successMessage = payload?.message || 'Password changed successfully'
        },
        [admin_change_password.pending]: (state) => {
            state.passwordLoader = true
            state.errorMessage = ''
        },
        [admin_change_password.rejected]: (state, { payload }) => {
            state.passwordLoader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to change password'
        },
        [admin_change_password.fulfilled]: (state, { payload }) => {
            state.passwordLoader = false
            state.successMessage = payload?.message || 'Password changed successfully'
        },
        [admin_update_profile.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [admin_update_profile.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to update profile'
        },
        [admin_update_profile.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload?.message || 'Profile updated successfully'
            state.userInfo = payload.userInfo
        },
        [create_admin.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [create_admin.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to create admin'
        },
        [create_admin.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload?.message || 'Admin created successfully'
        },
        [update_admin_username.pending]: (state) => {
            state.loader = true
            state.errorMessage = ''
        },
        [update_admin_username.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message || 'Unable to update username'
        },
        [update_admin_username.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload?.message || 'Username updated successfully'
            state.userInfo = payload.userInfo
        },
    }

})
export const { messageClear, resetAuthState, clearOtpChallenge, clearSignupOtpChallenge } = authReducer.actions
export default authReducer.reducer
