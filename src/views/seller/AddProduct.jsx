import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BsImages } from "react-icons/bs";
import { IoCloseSharp } from "react-icons/io5";
import { FiImage, FiPackage, FiPlusCircle } from "react-icons/fi";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast";
import { PropagateLoader } from "react-spinners";
import JoditEditor from "jodit-react";
import { overrideStyle } from "../../utils/utils";
import ProductImage from "../../components/ProductImage";
import ProductImageCropModal from "../../components/ProductImageCropModal";
import { get_category } from "../../store/Reducers/categoryReducer";
import { add_product, messageClear } from "../../store/Reducers/productReducer";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_HELPER_TEXT,
  buildCroppedProductImagePreview,
  createProductImagePreviewBatch,
  getProductImageThemeBackground,
  revokeProductImagePreview,
  revokeProductImagePreviews,
} from "../../utils/productImage";

const AddProduct = () => {
  const editor = useRef(null);
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const dispatch = useDispatch();
  const { categorys } = useSelector((state) => state.category);
  const { successMessage, errorMessage, loader } = useSelector(
    (state) => state.product,
  );
  const { userInfo } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(
      get_category({
        searchValue: "",
        parPage: "",
        page: "",
      }),
    );
  }, []);

  const [state, setState] = useState({
    name: "",
    description: "",
    discount: "",
    price: "",
    brand: "",
    stock: "",
  });

  const inputHandle = (e) => {
    setState({
      ...state,
      [e.target.name]: e.target.value,
    });
  };

  const [cateShow, setCateShow] = useState(false);
  const [category, setCategory] = useState("");
  const [allCategory, setAllCategory] = useState([]);
  const [searchValue, setSearchValue] = useState("");

  const categorySearch = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    if (value) {
      const srcValue = allCategory.filter(
        (c) => c.name.toLowerCase().indexOf(value.toLowerCase()) > -1,
      );
      setAllCategory(srcValue);
    } else {
      setAllCategory(categorys);
    }
  };

  const [images, setImages] = useState([]);
  const [imageShow, setImageShow] = useState([]);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const imageShowRef = useRef([]);
  const cropSessionRef = useRef(null);
  const [cropSession, setCropSession] = useState(null);

  useEffect(() => {
    imageShowRef.current = imageShow;
  }, [imageShow]);

  useEffect(() => {
    cropSessionRef.current = cropSession;
  }, [cropSession]);

  useEffect(() => {
    return () => {
      revokeProductImagePreviews(imageShowRef.current);
      revokeProductImagePreviews(cropSessionRef.current?.queue || []);
    };
  }, []);

  const clearCropSession = () => {
    revokeProductImagePreviews(cropSessionRef.current?.queue || []);
    cropSessionRef.current = null;
    setCropSession(null);
  };

  const startCropSession = async (fileList, mode, replaceIndex = null) => {
    if (cropSessionRef.current) {
      toast.error("Finish the current crop before selecting another image.");
      return;
    }

    const { previews, errors } = await createProductImagePreviewBatch(fileList);

    errors.forEach((error) => toast.error(error));

    if (previews.length > 0) {
      const nextSession = { mode, queue: previews, replaceIndex };
      cropSessionRef.current = nextSession;
      setCropSession(nextSession);
    }
  };

  const inmageHandle = async (e) => {
    await startCropSession(e.target.files, "append");
    e.target.value = "";
  };

  const changeImage = async (fileList, index) => {
    if (!fileList?.length) {
      return;
    }

    await startCropSession(fileList, "replace", index);
  };

  const removeImage = (i) => {
    setImages((currentImages) =>
      currentImages.filter((_, index) => index !== i),
    );
    setImageShow((currentImages) => {
      revokeProductImagePreview(currentImages[i]);
      return currentImages.filter((_, index) => index !== i);
    });
  };

  useEffect(() => {
    setAllCategory(categorys);
  }, [categorys]);

  const add = (e) => {
    e.preventDefault();

    if (images.length === 0) {
      toast.error("At least 1 product image is required");
      return;
    }
    if (!state.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    if (!state.price || Number(state.price) <= 0) {
      toast.error("Price must be greater than 0");
      return;
    }
    if (!state.stock || Number(state.stock) < 0) {
      toast.error("Stock is required");
      return;
    }

    setShouldRedirect(true);
    const formData = new FormData();
    formData.append("name", state.name);
    formData.append("description", content);
    formData.append("price", state.price);
    formData.append("stock", state.stock);
    formData.append("category", category);
    formData.append("discount", state.discount);
    formData.append("shopName", userInfo?.shopInfo?.shopName);
    formData.append("brand", state.brand);
    formData.append("imageBackground", getProductImageThemeBackground());
    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }
    dispatch(add_product(formData));
  };

  useEffect(() => {
    let redirectTimer;

    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
      setShouldRedirect(false);
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
      setState({
        name: "",
        description: "",
        discount: "",
        price: "",
        brand: "",
        stock: "",
      });
      setContent("");
      revokeProductImagePreviews(imageShowRef.current);
      imageShowRef.current = [];
      setImageShow([]);
      setImages([]);
      setCategory("");
      if (shouldRedirect) {
        redirectTimer = setTimeout(() => {
          navigate("/seller/dashboard/products");
        }, 800);
      }
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [successMessage, errorMessage, shouldRedirect, dispatch, navigate]);

  const imageWarningCount = imageShow.filter(
    (image) => image.warnings?.length > 0,
  ).length;
  const activeCropItem = cropSession?.queue?.[0] || null;

  const handleCropConfirm = async (croppedFile) => {
    const currentSession = cropSessionRef.current;
    const currentItem = currentSession?.queue?.[0];

    if (!currentSession || !currentItem) {
      return;
    }

    const croppedPreview = await buildCroppedProductImagePreview(
      croppedFile,
      currentItem,
    );

    if (
      currentSession.mode === "replace" &&
      Number.isInteger(currentSession.replaceIndex)
    ) {
      setImages((currentImages) => {
        const nextImages = [...currentImages];
        nextImages[currentSession.replaceIndex] = croppedFile;
        return nextImages;
      });

      setImageShow((currentImages) => {
        const nextImages = [...currentImages];
        revokeProductImagePreview(nextImages[currentSession.replaceIndex]);
        nextImages[currentSession.replaceIndex] = croppedPreview;
        return nextImages;
      });
    } else {
      setImages((currentImages) => [...currentImages, croppedFile]);
      setImageShow((currentImages) => [...currentImages, croppedPreview]);
    }

    revokeProductImagePreview(currentItem);

    const remainingQueue = currentSession.queue.slice(1);

    if (remainingQueue.length > 0) {
      const nextSession = {
        ...currentSession,
        queue: remainingQueue,
      };
      cropSessionRef.current = nextSession;
      setCropSession(nextSession);
      return;
    }

    cropSessionRef.current = null;
    setCropSession(null);
  };

  const handleUseOriginal = async (originalFile) => {
    const currentSession = cropSessionRef.current;
    const currentItem = currentSession?.queue?.[0];

    if (!currentSession || !currentItem || !originalFile) {
      return;
    }

    const originalPreview = {
      ...currentItem,
      file: originalFile,
      mode: "original",
    };

    if (
      currentSession.mode === "replace" &&
      Number.isInteger(currentSession.replaceIndex)
    ) {
      setImages((currentImages) => {
        const nextImages = [...currentImages];
        nextImages[currentSession.replaceIndex] = originalFile;
        return nextImages;
      });

      setImageShow((currentImages) => {
        const nextImages = [...currentImages];
        revokeProductImagePreview(nextImages[currentSession.replaceIndex]);
        nextImages[currentSession.replaceIndex] = originalPreview;
        return nextImages;
      });
    } else {
      setImages((currentImages) => [...currentImages, originalFile]);
      setImageShow((currentImages) => [...currentImages, originalPreview]);
    }

    const remainingQueue = currentSession.queue.slice(1);

    if (remainingQueue.length > 0) {
      const nextSession = {
        ...currentSession,
        queue: remainingQueue,
      };
      cropSessionRef.current = nextSession;
      setCropSession(nextSession);
      return;
    }

    cropSessionRef.current = null;
    setCropSession(null);
  };

  return (
    <div className="px-2 lg:px-7 pt-5 pb-7">
      <div className="w-full rounded-2xl border border-slate-700 bg-[#283046] p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[#d0d2d6] text-xl md:text-2xl font-semibold flex items-center gap-2">
              <FiPlusCircle />
              Add Product
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Add product information, pricing and images.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-md bg-blue-500 px-5 py-2 text-white hover:shadow-lg hover:shadow-blue-500/40"
            to="/seller/dashboard/products"
          >
            Back To Products
          </Link>
        </div>

        <form onSubmit={add} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="xl:col-span-8 space-y-6">
              <div className="rounded-xl border border-slate-700 bg-[#1f2d44] p-4 md:p-5">
                <h2 className="mb-4 text-[#d0d2d6] font-medium text-base flex items-center gap-2">
                  <FiPackage />
                  Basic Details
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#d0d2d6]">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="name">Product Name</label>
                    <input
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]"
                      onChange={inputHandle}
                      value={state.name}
                      type="text"
                      placeholder="Product name"
                      name="name"
                      id="name"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="brand">Product Brand</label>
                    <input
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]"
                      onChange={inputHandle}
                      value={state.brand}
                      type="text"
                      placeholder="Product brand"
                      name="brand"
                      id="brand"
                    />
                  </div>

                  <div className="flex flex-col gap-1 relative">
                    <label htmlFor="category">Category</label>
                    <input
                      readOnly
                      onClick={() => setCateShow(!cateShow)}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]"
                      onChange={inputHandle}
                      value={category}
                      type="text"
                      placeholder="--select category--"
                      id="category"
                    />

                    <div
                      className={`absolute top-[101%] left-0 z-20 bg-slate-800 w-full rounded-md border border-slate-700 origin-top transition-all ${
                        cateShow
                          ? "scale-100 opacity-100"
                          : "scale-95 opacity-0 pointer-events-none"
                      }`}
                    >
                      <div className="w-full px-3 py-3 border-b border-slate-700">
                        <input
                          value={searchValue}
                          onChange={categorySearch}
                          className="px-3 py-2 w-full focus:border-indigo-500 outline-none bg-transparent border border-slate-700 rounded-md text-[#d0d2d6]"
                          type="text"
                          placeholder="Search category"
                        />
                      </div>

                      <div className="max-h-[220px] overflow-y-auto">
                        {allCategory.map((c) => (
                          <span
                            key={c._id || c.name}
                            className={`px-4 py-2 hover:bg-indigo-500 hover:text-white w-full cursor-pointer block ${
                              category === c.name
                                ? "bg-indigo-500 text-white"
                                : ""
                            }`}
                            onClick={() => {
                              setCateShow(false);
                              setCategory(c.name);
                              setSearchValue("");
                              setAllCategory(categorys);
                            }}
                          >
                            {c.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor="stock">Stock</label>
                    <input
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]"
                      onChange={inputHandle}
                      value={state.stock}
                      type="number"
                      min="0"
                      placeholder="Product stock"
                      name="stock"
                      id="stock"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#1f2d44] p-4 md:p-5">
                <h2 className="mb-4 text-[#d0d2d6] font-medium text-base">
                  Pricing
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#d0d2d6]">
                  <div className="flex flex-col gap-1">
                    <label htmlFor="price">Price</label>
                    <input
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]"
                      onChange={inputHandle}
                      value={state.price}
                      type="number"
                      placeholder="Price"
                      name="price"
                      id="price"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label htmlFor="discount">Discount</label>
                    <input
                      min="0"
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6]"
                      onChange={inputHandle}
                      value={state.discount}
                      type="number"
                      placeholder="% discount"
                      name="discount"
                      id="discount"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#1f2d44] p-4 md:p-5">
                <h2 className="mb-4 text-[#d0d2d6] font-medium text-base">
                  Description
                </h2>
                <div className="text-[#d0d2d6]">
                  <JoditEditor
                    ref={editor}
                    value={content}
                    tabIndex={1}
                    onBlur={(newContent) => setContent(newContent)}
                    onChange={(newContent) => setContent(newContent)}
                  />
                </div>
              </div>
            </div>

            <div className="xl:col-span-4 space-y-6">
              <div className="rounded-xl border border-slate-700 bg-[#1f2d44] p-4 md:p-5">
                <h2 className="mb-3 text-[#d0d2d6] font-medium text-base">
                  Product Status
                </h2>
                <div className="space-y-2 text-sm text-slate-300">
                  <p>
                    <span className="text-slate-400">Approval:</span> pending
                  </p>
                  <p>
                    <span className="text-slate-400">Images:</span>{" "}
                    {imageShow.length}
                  </p>
                  <p>
                    <span className="text-slate-400">Category:</span>{" "}
                    {category || "N/A"}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#1f2d44] p-4 md:p-5">
                <h2 className="mb-4 text-[#d0d2d6] font-medium text-base flex items-center gap-2">
                  <FiImage />
                  Product Images
                </h2>
                <p className="mb-4 text-xs text-slate-400">
                  {PRODUCT_IMAGE_HELPER_TEXT}
                </p>

                {imageWarningCount > 0 && (
                  <div className="mb-4 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    {imageWarningCount} image(s) need careful framing before
                    they are saved as square product images.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
                  {imageShow.map((img, i) => (
                    <div
                      key={img.id}
                      className="relative overflow-hidden rounded-md border border-slate-700"
                    >
                      <label
                        className="block cursor-pointer"
                        htmlFor={`product-image-${img.id}`}
                      >
                        <div className="relative">
                          <ProductImage
                            alt={img.name}
                            className="w-full"
                            imgClassName="p-2"
                            src={img.url}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 transition-all hover:opacity-100">
                            Change Image
                          </div>
                        </div>
                      </label>
                      <input
                        onChange={(e) => {
                          changeImage(e.target.files, i);
                          e.target.value = "";
                        }}
                        accept={PRODUCT_IMAGE_ACCEPT}
                        type="file"
                        id={`product-image-${img.id}`}
                        className="hidden"
                      />
                      <span
                        onClick={() => removeImage(i)}
                        className="p-2 z-10 cursor-pointer bg-slate-700 hover:shadow-lg hover:shadow-slate-400/50 text-white absolute top-1 right-1 rounded-full"
                      >
                        <IoCloseSharp />
                      </span>
                      <div className="space-y-1 border-t border-slate-700 bg-[#162235] p-2">
                        <p className="truncate text-xs text-slate-300">
                          {img.name}
                        </p>
                        {img.originalWidth && img.originalHeight && (
                          <p className="text-[11px] text-slate-400">
                            Original: {img.originalWidth} x {img.originalHeight}
                            px
                          </p>
                        )}
                        {img.outputWidth && img.outputHeight && (
                          <p className="text-[11px] text-slate-400">
                            Output: {img.outputWidth} x {img.outputHeight}px
                          </p>
                        )}
                        <p className="text-[11px] text-slate-400">
                          Mode:{" "}
                          {img.mode === "cropped"
                            ? "Square crop"
                            : "Original fit"}
                        </p>
                        {img.warnings?.map((warning) => (
                          <p
                            key={`${img.id}-${warning}`}
                            className="text-[11px] text-amber-300"
                          >
                            {warning}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}

                  <label
                    className="h-[120px] rounded-md border border-dashed border-slate-600 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer text-[#d0d2d6] gap-2"
                    htmlFor="image"
                  >
                    <BsImages />
                    <span className="text-xs">Select Image</span>
                  </label>
                  <input
                    multiple
                    accept={PRODUCT_IMAGE_ACCEPT}
                    onChange={inmageHandle}
                    name="images"
                    className="hidden"
                    type="file"
                    id="image"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              disabled={loader ? true : false}
              className="inline-flex items-center justify-center gap-2 bg-blue-500 w-[210px] hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 disabled:opacity-60"
            >
              {loader ? (
                <PropagateLoader color="#fff" cssOverride={overrideStyle} />
              ) : (
                <>
                  <FiPlusCircle />
                  Add Product
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <ProductImageCropModal
        backgroundColor={getProductImageThemeBackground()}
        image={activeCropItem}
        onCancel={clearCropSession}
        onConfirm={handleCropConfirm}
        onSkip={handleUseOriginal}
      />
    </div>
  );
};

export default AddProduct;
