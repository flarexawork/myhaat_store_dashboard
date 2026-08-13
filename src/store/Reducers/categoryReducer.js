import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import axios from 'axios'
import { api_url } from '../../utils/utils'

export const categoryAdd = createAsyncThunk(
    'category/categoryAdd',
    async ({ name, image }, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
        try {
            const formData = new FormData()
            formData.append('name', name)
            formData.append('image', image)
            const { data } = await axios.post(`${api_url}/api/category-add`, formData, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_category = createAsyncThunk(
    'category/get_category',
    async ({ parPage, page, searchValue }, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        }
        try {
            const { data } = await axios.get(`${api_url}/api/category-get?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const categoryUpdate = createAsyncThunk(
    'category/categoryUpdate',
    async ({ categoryId, category }, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        try {
            const formData = new FormData()
            formData.append('name', category.name)
            if (category.image) {
                formData.append('image', category.image)
            }
            const { data } = await axios.put(`${api_url}/api/category/${categoryId}`, formData, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const categoryDelete = createAsyncThunk(
    'category/categoryDelete',
    async (categoryId, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        try {
            const { data } = await axios.delete(`${api_url}/api/category/${categoryId}`, config)
            return fulfillWithValue({ ...data, categoryId })
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_category_variations = createAsyncThunk(
    'category/get_category_variations',
    async (categoryId, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        try {
            const { data } = await axios.get(`${api_url}/api/category/${categoryId}/variations`, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const update_category_variations = createAsyncThunk(
    'category/update_category_variations',
    async ({ categoryId, variations }, { rejectWithValue, fulfillWithValue, getState }) => {
        const token = getState().auth.token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
        try {
            const { data } = await axios.put(`${api_url}/api/category/${categoryId}/variations`, { variations }, config)
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)



export const categoryReducer = createSlice({
    name: 'category',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        deleteLoaderId: '',
        categorys: [],
        totalCategory: 0,
        variationConfig: { variations: [] }
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        }
    },
    extraReducers: {
        [categoryAdd.pending]: (state, _) => {
            state.loader = true
        },
        [categoryAdd.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message
        },
        [categoryAdd.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload.message
            state.categorys = [payload.category, ...state.categorys]
            state.totalCategory = state.totalCategory + 1
        },
        [get_category.fulfilled]: (state, { payload }) => {
            state.totalCategory = payload.totalCategory
            state.categorys = payload.categorys
        },
        [get_category.rejected]: (state, { payload }) => {
            state.errorMessage = payload?.error || payload?.message
        },
        [categoryUpdate.pending]: (state, _) => {
            state.loader = true
        },
        [categoryUpdate.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message
        },
        [categoryUpdate.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload.message
            state.categorys = state.categorys.map((item) => item._id === payload.category._id ? payload.category : item)
        },
        [categoryDelete.pending]: (state, { meta }) => {
            state.deleteLoaderId = meta.arg
        },
        [categoryDelete.rejected]: (state, { payload }) => {
            state.deleteLoaderId = ''
            state.errorMessage = payload?.error || payload?.message
        },
        [categoryDelete.fulfilled]: (state, { payload }) => {
            state.deleteLoaderId = ''
            state.successMessage = payload.message
            state.categorys = state.categorys.filter((item) => item._id !== payload.categoryId)
            state.totalCategory = Math.max(0, state.totalCategory - 1)
        },
        [get_category_variations.fulfilled]: (state, { payload }) => {
            state.variationConfig = payload.config
        },
        [update_category_variations.pending]: (state, _) => {
            state.loader = true
        },
        [update_category_variations.rejected]: (state, { payload }) => {
            state.loader = false
            state.errorMessage = payload?.error || payload?.message
        },
        [update_category_variations.fulfilled]: (state, { payload }) => {
            state.loader = false
            state.successMessage = payload.message
            state.variationConfig = payload.config
        },
    }

})
export const { messageClear } = categoryReducer.actions
export default categoryReducer.reducer
