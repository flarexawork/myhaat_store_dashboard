import React, { useEffect, useState } from 'react'
import { FaEdit, FaTrash } from 'react-icons/fa'
import { PropagateLoader } from 'react-spinners'
import { overrideStyle } from '../../utils/utils'
import { GrClose } from 'react-icons/gr'
import Pagination from '../Pagination'
import { BsImage } from 'react-icons/bs'
import toast from 'react-hot-toast'
import { useSelector, useDispatch } from 'react-redux'
import Search from '../components/Search'
import { categoryAdd, categoryDelete, categoryUpdate, messageClear, get_category, get_category_variations, update_category_variations } from '../../store/Reducers/categoryReducer'

const initialState = {
    name: '',
    image: ''
}

const Category = () => {
    const dispatch = useDispatch()
    const { loader, successMessage, errorMessage, categorys, totalCategory, deleteLoaderId } = useSelector(state => state.category)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchValue, setSearchValue] = useState('')
    const [parPage, setParPage] = useState(5)
    const [show, setShow] = useState(false)
    const [imageShow, setImage] = useState('')
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingCategoryId, setEditingCategoryId] = useState('')
    const [deleteTarget, setDeleteTarget] = useState(null)
    const [state, setState] = useState(initialState)
    const [variationDrafts, setVariationDrafts] = useState([])

    const changeSearchValue = (value) => {
        setSearchValue(value)
        setCurrentPage(1)
    }

    const changeParPage = (value) => {
        setParPage(value)
        setCurrentPage(1)
    }

    const resetForm = () => {
        setState(initialState)
        setImage('')
        setIsEditMode(false)
        setEditingCategoryId('')
        setVariationDrafts([])
    }

    const imageHandle = (e) => {
        let files = e.target.files
        if (files.length > 0) {
            setImage(URL.createObjectURL(files[0]))
            setState({
                ...state,
                image: files[0]
            })
        }
    }

    const submit_category = (e) => {
        e.preventDefault()
        const name = state.name.trim()

        if (!name) {
            toast.error('Category name is required')
            return
        }

        if (!isEditMode && !state.image) {
            toast.error('Category image is required')
            return
        }

        if (isEditMode) {
            dispatch(categoryUpdate({
                categoryId: editingCategoryId,
                category: {
                    name,
                    image: state.image
                }
            }))
        } else {
            dispatch(categoryAdd({
                name,
                image: state.image
            }))
        }
    }

    const editCategoryHandler = (category) => {
        setIsEditMode(true)
        setEditingCategoryId(category._id)
        setState({
            name: category.name,
            image: ''
        })
        setImage(category.image)
        setShow(true)
        dispatch(get_category_variations(category._id))
    }

    const addVariationDraft = () => {
        setVariationDrafts(current => [
            ...current,
            {
                name: '',
                label: '',
                isRequired: true,
                isActive: true,
                options: [{ label: '', value: '', group: '', isActive: true }]
            }
        ])
    }

    const updateVariationDraft = (index, key, value) => {
        setVariationDrafts(current => current.map((variation, itemIndex) => itemIndex === index ? {
            ...variation,
            [key]: value
        } : variation))
    }

    const removeVariationDraft = (index) => {
        setVariationDrafts(current => current.filter((_, itemIndex) => itemIndex !== index))
    }

    const addOptionDraft = (variationIndex) => {
        setVariationDrafts(current => current.map((variation, itemIndex) => itemIndex === variationIndex ? {
            ...variation,
            options: [
                ...(variation.options || []),
                { label: '', value: '', group: '', isActive: true }
            ]
        } : variation))
    }

    const updateOptionDraft = (variationIndex, optionIndex, key, value) => {
        setVariationDrafts(current => current.map((variation, itemIndex) => {
            if (itemIndex !== variationIndex) return variation

            return {
                ...variation,
                options: (variation.options || []).map((option, currentOptionIndex) => currentOptionIndex === optionIndex ? {
                    ...option,
                    [key]: value
                } : option)
            }
        }))
    }

    const removeOptionDraft = (variationIndex, optionIndex) => {
        setVariationDrafts(current => current.map((variation, itemIndex) => itemIndex === variationIndex ? {
            ...variation,
            options: (variation.options || []).filter((_, currentOptionIndex) => currentOptionIndex !== optionIndex)
        } : variation))
    }

    const saveVariationConfig = () => {
        if (!editingCategoryId) return

        const cleaned = variationDrafts
            .map((variation) => ({
                ...variation,
                name: variation.name.trim(),
                label: (variation.label || variation.name).trim(),
                options: (variation.options || [])
                    .map((option) => ({
                        ...option,
                        label: option.label.trim(),
                        value: (option.value || option.label).trim(),
                        group: option.group.trim()
                    }))
                    .filter((option) => option.label && option.value)
            }))
            .filter((variation) => variation.name && variation.options.length)

        dispatch(update_category_variations({
            categoryId: editingCategoryId,
            variations: cleaned
        }))
    }

    const deleteCategoryHandler = () => {
        if (deleteTarget?._id) {
            dispatch(categoryDelete(deleteTarget._id))
        }
    }

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage)
            dispatch(messageClear())
        }
        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear())
            resetForm()
            setShow(false)
            setDeleteTarget(null)
            dispatch(get_category({
                parPage: parseInt(parPage),
                page: parseInt(currentPage),
                searchValue
            }))
        }
    }, [successMessage, errorMessage, dispatch, parPage, currentPage, searchValue])

    useEffect(() => {
        const obj = {
            parPage: parseInt(parPage),
            page: parseInt(currentPage),
            searchValue
        }
        dispatch(get_category(obj))
    }, [searchValue, currentPage, parPage, dispatch])

    useEffect(() => {
        const totalPage = Math.max(1, Math.ceil(totalCategory / parPage))
        if (currentPage > totalPage) {
            setCurrentPage(totalPage)
        }
    }, [currentPage, totalCategory, parPage])

    useEffect(() => {
        return () => {
            if (imageShow && imageShow.startsWith('blob:')) {
                URL.revokeObjectURL(imageShow)
            }
        }
    }, [imageShow])

    const variationConfig = useSelector(state => state.category.variationConfig)

    useEffect(() => {
        if (isEditMode) {
            setVariationDrafts(variationConfig?.variations || [])
        }
    }, [variationConfig, isEditMode])

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='flex xl:hidden justify-between items-center mb-5 p-4 bg-[#283046] rounded-md'>
                <h1 className='text-[#d0d2d6] font-semibold text-lg'>Categorys</h1>
                <button onClick={() => {
                    resetForm()
                    setShow(true)
                }} className='bg-indigo-500 shadow-lg hover:shadow-indigo-500/50 px-4 py-2 cursor-pointer text-white rounded-sm text-sm'>Add</button>
            </div>
            {
                show && <div onClick={() => setShow(false)} className='fixed inset-0 z-[9998] bg-black/50 xl:hidden'></div>
            }
            <div className='flex flex-wrap w-full'>
                <div className='w-full xl:w-7/12'>
                    <div className='w-full p-4  bg-[#283046] rounded-md'>
                        <Search setParPage={changeParPage} setSearchValue={changeSearchValue} searchValue={searchValue} />
                        <div className='relative overflow-x-auto'>
                            <table className='w-full text-sm text-left text-[#d0d2d6]'>
                                <thead className='text-sm text-[#d0d2d6] uppercase border-b border-slate-700'>
                                    <tr>
                                        <th scope='col' className='py-3 px-4'>No</th>
                                        <th scope='col' className='py-3 px-4'>Image</th>
                                        <th scope='col' className='py-3 px-4'>Name</th>
                                        <th scope='col' className='py-3 px-4'>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        categorys.map((d, i) => <tr key={d._id} className='border-b border-slate-700'>
                                            <td className='py-3 px-4 font-medium whitespace-nowrap'>{((currentPage - 1) * parPage) + i + 1}</td>
                                            <td className='py-1 px-4 font-medium whitespace-nowrap'>
                                                <img className='w-[45px] h-[45px] rounded object-cover' src={d.image} alt={d.name} />
                                            </td>
                                            <td className='py-1 px-4 font-medium whitespace-nowrap'>
                                                <span>{d.name}</span>
                                            </td>
                                            <td className='py-1 px-4 font-medium whitespace-nowrap'>
                                                <div className='flex justify-start items-center gap-4'>
                                                    <button type='button' onClick={() => editCategoryHandler(d)} className='p-[6px] bg-yellow-500 rounded hover:shadow-lg hover:shadow-yellow-500/50' title='Edit category'>
                                                        <FaEdit />
                                                    </button>
                                                    <button type='button' onClick={() => setDeleteTarget(d)} disabled={deleteLoaderId === d._id} className='p-[6px] bg-red-500 rounded hover:shadow-lg hover:shadow-red-500/50 disabled:opacity-60' title='Delete category'>
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>)
                                    }
                                    {
                                        categorys.length === 0 && <tr>
                                            <td colSpan={4} className='py-6 text-center text-slate-400'>No category found</td>
                                        </tr>
                                    }
                                </tbody>
                            </table>
                        </div>
                        {
                            totalCategory > parPage && <div className='w-full flex justify-end mt-4 bottom-4 right-4'>
                                <Pagination
                                    pageNumber={currentPage}
                                    setPageNumber={setCurrentPage}
                                    totalItem={totalCategory}
                                    parPage={parPage}
                                    showItem={4}
                                />
                            </div>
                        }
                    </div>
                </div>
                <div className={`fixed top-0 z-[9999] h-screen w-[min(100vw-16px,460px)] transition-all duration-500 xl:relative xl:right-0 xl:h-auto xl:w-5/12 ${show ? 'right-0' : '-right-[calc(100vw+16px)]'}`}>
                    <div className='w-full pl-0 xl:pl-5'>
                        <div className='h-screen overflow-y-auto bg-[#283046] px-3 py-3 text-[#d0d2d6] xl:h-auto xl:max-h-[calc(100vh-40px)] xl:rounded-md xl:px-4'>
                            <div className='flex justify-between items-center mb-4'>
                                <div>
                                    <h1 className='text-[#d0d2d6] font-semibold text-xl'>{isEditMode ? 'Edit Category' : 'Add Category'}</h1>
                                    <p className='text-slate-400 text-sm mt-1'>{isEditMode ? 'Update the selected category details.' : 'Create a category for the dashboard and seller product forms.'}</p>
                                </div>
                                <div onClick={() => setShow(false)} className='block xl:hidden cursor-pointer'><GrClose className='text-[#d0d2d6]' /></div>
                            </div>
                            <form onSubmit={submit_category}>
                                <div className='flex flex-col w-full gap-1 mb-3'>
                                    <label htmlFor="name">Category name</label>
                                    <input value={state.name} onChange={(e) => setState({ ...state, name: e.target.value })} className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]' type="text" id='name' name='category_name' placeholder='category name' required />
                                </div>
                                <div>
                                    <label className='flex justify-center items-center flex-col h-[238px] cursor-pointer border border-dashed hover:border-indigo-500 w-full border-[#d0d2d6]' htmlFor="image">
                                        {
                                            imageShow ? <img className='w-full h-full object-cover' src={imageShow} alt='category preview' /> : <>
                                                <span><BsImage /></span>
                                                <span>{isEditMode ? 'select new image' : 'select image'}</span>
                                            </>
                                        }
                                    </label>
                                </div>
                                <input onClick={(e) => {
                                    e.target.value = null
                                }} onChange={imageHandle} className='hidden' type="file" name='image' id='image' required={!isEditMode} />
                                <p className='text-xs text-slate-400 mt-2'>{isEditMode ? 'Leave image unchanged to keep the current category image.' : 'Upload a category image to continue.'}</p>
                                <div className='mt-4 flex flex-col gap-3 sm:flex-row'>
                                    <button disabled={loader ? true : false} className='bg-blue-500 w-full hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3'>
                                        {
                                            loader ? <PropagateLoader color='#fff' cssOverride={overrideStyle} /> : isEditMode ? 'Update Category' : 'Add Category'
                                        }
                                    </button>
                                    {
                                        isEditMode && <button type='button' onClick={resetForm} className='bg-slate-700 w-full hover:shadow-lg hover:shadow-slate-700/30 text-white rounded-md px-7 py-2 mb-3'>Cancel Edit</button>
                                    }
                                </div>
                            </form>
                            {
                                isEditMode && <div className='mt-5 border-t border-slate-700 pt-4'>
                                    <div className='mb-3 flex items-center justify-between gap-2'>
                                        <div>
                                            <h2 className='text-base font-semibold text-[#d0d2d6]'>Variation Configuration</h2>
                                            <p className='text-xs text-slate-400'>Define dynamic product options for this category.</p>
                                        </div>
                                        <button type='button' onClick={addVariationDraft} className='rounded-md bg-indigo-500 px-3 py-2 text-xs text-white'>Add Type</button>
                                    </div>

                                    <div className='space-y-4'>
                                        {variationDrafts.map((variation, variationIndex) => (
                                            <div key={variationIndex} className='min-w-0 rounded-md border border-slate-700 bg-[#1f2d44] p-3'>
                                                <div className='grid min-w-0 grid-cols-1 gap-2 2xl:grid-cols-2'>
                                                    <input value={variation.name} onChange={(e) => updateVariationDraft(variationIndex, 'name', e.target.value)} className='min-w-0 px-3 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]' placeholder='Type name e.g. Size' />
                                                    <input value={variation.label || ''} onChange={(e) => updateVariationDraft(variationIndex, 'label', e.target.value)} className='min-w-0 px-3 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]' placeholder='Label' />
                                                </div>
                                                <div className='mt-2 flex flex-wrap gap-3 text-xs'>
                                                    <label className='flex items-center gap-2'>
                                                        <input checked={variation.isRequired !== false} onChange={(e) => updateVariationDraft(variationIndex, 'isRequired', e.target.checked)} type='checkbox' />
                                                        Required
                                                    </label>
                                                    <label className='flex items-center gap-2'>
                                                        <input checked={variation.isActive !== false} onChange={(e) => updateVariationDraft(variationIndex, 'isActive', e.target.checked)} type='checkbox' />
                                                        Enabled
                                                    </label>
                                                    <button type='button' onClick={() => removeVariationDraft(variationIndex)} className='text-red-300'>Remove Type</button>
                                                </div>

                                                <div className='mt-3 space-y-2'>
                                                    {(variation.options || []).map((option, optionIndex) => (
                                                        <div key={optionIndex} className='grid min-w-0 grid-cols-1 gap-2 rounded-md border border-slate-700/70 bg-[#283046]/45 p-2 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'>
                                                            <label className='min-w-0 text-xs text-slate-400'>
                                                                Option label
                                                                <input value={option.label} onChange={(e) => updateOptionDraft(variationIndex, optionIndex, 'label', e.target.value)} className='mt-1 w-full min-w-0 px-3 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-sm text-[#d0d2d6]' placeholder='Option label' />
                                                            </label>
                                                            <label className='min-w-0 text-xs text-slate-400'>
                                                                Value
                                                                <input value={option.value || ''} onChange={(e) => updateOptionDraft(variationIndex, optionIndex, 'value', e.target.value)} className='mt-1 w-full min-w-0 px-3 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-sm text-[#d0d2d6]' placeholder='Value' />
                                                            </label>
                                                            <label className='min-w-0 text-xs text-slate-400'>
                                                                Group optional
                                                                <input value={option.group || ''} onChange={(e) => updateOptionDraft(variationIndex, optionIndex, 'group', e.target.value)} className='mt-1 w-full min-w-0 px-3 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-sm text-[#d0d2d6]' placeholder='Group optional' />
                                                            </label>
                                                            <button type='button' onClick={() => removeOptionDraft(variationIndex, optionIndex)} className='h-10 rounded-md bg-red-500 px-3 py-2 text-sm text-white 2xl:self-end'>Delete</button>
                                                        </div>
                                                    ))}
                                                    <button type='button' onClick={() => addOptionDraft(variationIndex)} className='rounded-md bg-slate-700 px-3 py-2 text-xs text-white'>Add Option</button>
                                                </div>
                                            </div>
                                        ))}
                                        {variationDrafts.length === 0 && <p className='text-sm text-slate-400'>No variations configured for this category.</p>}
                                        <button type='button' onClick={saveVariationConfig} disabled={loader} className='w-full rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-60'>Save Variation Configuration</button>
                                    </div>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            </div>
            {
                deleteTarget && <div className='fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 px-4'>
                    <div className='w-full max-w-md rounded-md bg-[#283046] p-5 text-[#d0d2d6] shadow-lg'>
                        <h2 className='text-lg font-semibold'>Delete Category</h2>
                        <p className='mt-2 text-sm text-slate-300'>Are you sure you want to delete <span className='font-medium text-white'>{deleteTarget.name}</span>? This action cannot be undone.</p>
                        <div className='mt-5 flex justify-end gap-3'>
                            <button type='button' onClick={() => setDeleteTarget(null)} className='rounded-md bg-slate-700 px-4 py-2 text-sm text-white'>No</button>
                            <button type='button' onClick={deleteCategoryHandler} disabled={deleteLoaderId === deleteTarget._id} className='rounded-md bg-red-500 px-4 py-2 text-sm text-white disabled:opacity-60'>
                                {deleteLoaderId === deleteTarget._id ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>
    )
}

export default Category
