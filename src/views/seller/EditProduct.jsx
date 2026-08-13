import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import { PropagateLoader } from "react-spinners";
import toast from "react-hot-toast";
import { FiEdit3, FiImage, FiPackage, FiSave } from "react-icons/fi";
import { get_category } from "../../store/Reducers/categoryReducer";
import {
  get_product,
  messageClear,
  update_product,
  product_image_update,
} from "../../store/Reducers/productReducer";
import JoditEditor from "jodit-react";
import { api_url, overrideStyle } from "../../utils/utils";
import ProductImage from "../../components/ProductImage";
import ProductImageCropModal from "../../components/ProductImageCropModal";
import {
  PRODUCT_IMAGE_ACCEPT,
  PRODUCT_IMAGE_HELPER_TEXT,
  buildCroppedProductImagePreview,
  createProductImagePreviewBatch,
  createRemoteProductImagePreview,
  getProductImageThemeBackground,
  revokeProductImagePreview,
  revokeProductImagePreviews,
} from "../../utils/productImage";
import {
  buildSelectedProductVariations,
  buildVariantCombinations,
  parsePincodes,
} from "../../utils/variationHelpers";

const EditProduct = () => {
  const editor = useRef(null);
  const [content, setContent] = useState("");
  const navigate = useNavigate();

  const { productId } = useParams();
  const dispatch = useDispatch();
  const { categorys } = useSelector((state) => state.category);
  const { product, loader, errorMessage, successMessage } = useSelector(
    (state) => state.product,
  );
  const isApproved = product?.approval_status === "approved";

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

  useEffect(() => {
    dispatch(get_product(productId));
  }, [productId]);

  const [cateShow, setCateShow] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [allCategory, setAllCategory] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [variationConfig, setVariationConfig] = useState({ variations: [] });
  const [selectedOptions, setSelectedOptions] = useState({});
  const [variantCombinations, setVariantCombinations] = useState([]);
  const [pincodeText, setPincodeText] = useState("");

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

  const startCropSession = async (fileList, replaceIndex) => {
    if (cropSessionRef.current) {
      toast.error("Finish the current crop before selecting another image.");
      return;
    }

    const { previews, errors } = await createProductImagePreviewBatch(fileList);
    errors.forEach((error) => toast.error(error));

    if (previews.length > 0) {
      const nextSession = { mode: "replace", queue: previews, replaceIndex };
      cropSessionRef.current = nextSession;
      setCropSession(nextSession);
    }
  };

  const changeImage = async (files, index) => {
    if (isApproved) {
      toast.error("Approved product cannot be edited");
      return;
    }

    if (!files?.length) {
      return;
    }

    await startCropSession(files, index);
  };

  useEffect(() => {
    setState({
      name: product?.name || "",
      description: product?.description || "",
      discount: product?.discount || "",
      price: product?.price || "",
      brand: product?.brand || "",
      stock: product?.stock || "",
    });
    setContent(product?.description || "");
    setCategory(product?.category || "");
    setCategoryId(product?.categoryId || "");
    setPincodeText((product?.deliveryPincodes || []).join("\n"));
    const nextSelectedOptions = {};
    (product?.variations || []).forEach((variation) => {
      nextSelectedOptions[variation.name] = (variation.selectedOptions || []).map((option) => option.value);
    });
    setSelectedOptions(nextSelectedOptions);
    setVariantCombinations(product?.variantCombinations || []);
    setImageShow((currentImages) => {
      revokeProductImagePreviews(currentImages);
      return (product?.images || []).map((image, index) =>
        createRemoteProductImagePreview(image, index),
      );
    });
  }, [product]);

  useEffect(() => {
    if (!categoryId) {
      setVariationConfig({ variations: [] });
      return;
    }

    const loadConfig = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const { data } = await axios.get(
          `${api_url}/api/category/${categoryId}/variations`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        setVariationConfig(data.config || { variations: [] });
      } catch (error) {
        toast.error("Unable to load category variations");
      }
    };

    loadConfig();
  }, [categoryId]);

  const toggleOption = (variation, option) => {
    if (isApproved) return;

    setSelectedOptions((current) => {
      const currentValues = current[variation.name] || [];
      const nextValues = currentValues.includes(option.value)
        ? currentValues.filter((value) => value !== option.value)
        : [...currentValues, option.value];
      const nextSelection = {
        ...current,
        [variation.name]: nextValues,
      };
      const selectedVariations = buildSelectedProductVariations(
        variationConfig.variations || [],
        nextSelection,
      );
      setVariantCombinations((existing) =>
        buildVariantCombinations(selectedVariations, existing),
      );
      return nextSelection;
    });
  };

  const updateCombination = (variantKey, key, value) => {
    setVariantCombinations((current) =>
      current.map((item) =>
        item.variantKey === variantKey ? { ...item, [key]: value } : item,
      ),
    );
  };

  useEffect(() => {
    if (categorys.length > 0) {
      setAllCategory(categorys);
    }
  }, [categorys]);

  useEffect(() => {
    let redirectTimer;

    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
      setImageShow((currentImages) => {
        revokeProductImagePreviews(currentImages);
        return (product?.images || []).map((image, index) =>
          createRemoteProductImagePreview(image, index),
        );
      });
      setShouldRedirect(false);
    }
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
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
    const replaceIndex = currentSession?.replaceIndex;

    if (!currentSession || !currentItem || !Number.isInteger(replaceIndex)) {
      return;
    }

    const currentPreview = imageShowRef.current[replaceIndex];
    const oldImageUrl =
      currentPreview?.serverUrl || product?.images?.[replaceIndex];

    const croppedPreview = await buildCroppedProductImagePreview(croppedFile, {
      ...currentItem,
      serverUrl: oldImageUrl,
    });

    setImageShow((currentImages) => {
      const nextImages = [...currentImages];
      revokeProductImagePreview(nextImages[replaceIndex]);
      nextImages[replaceIndex] = croppedPreview;
      return nextImages;
    });

    revokeProductImagePreview(currentItem);
    cropSessionRef.current = null;
    setCropSession(null);

    setShouldRedirect(true);
    dispatch(
      product_image_update({
        oldImage: oldImageUrl,
        newImage: croppedFile,
        productId,
        imageBackground: getProductImageThemeBackground(),
      }),
    );
  };

  const handleUseOriginal = async (originalFile) => {
    const currentSession = cropSessionRef.current;
    const currentItem = currentSession?.queue?.[0];
    const replaceIndex = currentSession?.replaceIndex;

    if (
      !currentSession ||
      !currentItem ||
      !originalFile ||
      !Number.isInteger(replaceIndex)
    ) {
      return;
    }

    const currentPreview = imageShowRef.current[replaceIndex];
    const oldImageUrl =
      currentPreview?.serverUrl || product?.images?.[replaceIndex];

    const originalPreview = {
      ...currentItem,
      file: originalFile,
      mode: "original",
      serverUrl: oldImageUrl,
    };

    setImageShow((currentImages) => {
      const nextImages = [...currentImages];
      revokeProductImagePreview(nextImages[replaceIndex]);
      nextImages[replaceIndex] = originalPreview;
      return nextImages;
    });

    cropSessionRef.current = null;
    setCropSession(null);

    setShouldRedirect(true);
    dispatch(
      product_image_update({
        oldImage: oldImageUrl,
        newImage: originalFile,
        productId,
        imageBackground: getProductImageThemeBackground(),
      }),
    );
  };

  const update = (e) => {
    e.preventDefault();
    if (isApproved) {
      toast.error("Approved product cannot be edited");
      return;
    }
    const obj = {
      name: state.name,
      description: content,
      discount: state.discount,
      price: state.price,
      brand: state.brand,
      stock: state.stock,
      productId: productId,
      category,
      categoryId,
      variations: buildSelectedProductVariations(
        variationConfig.variations || [],
        selectedOptions,
      ),
      variantCombinations: variantCombinations.filter((item) => item.isActive !== false),
      deliveryPincodes: parsePincodes(pincodeText),
    };
    setShouldRedirect(true);
    dispatch(update_product(obj));
  };

  return (
    <div className="px-2 lg:px-7 pt-5 pb-7">
      <div className="w-full rounded-2xl border border-slate-700 bg-[#283046] p-4 md:p-6">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-[#d0d2d6] text-xl md:text-2xl font-semibold flex items-center gap-2">
              <FiEdit3 />
              Edit Product
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Update product information, pricing and images.
            </p>
          </div>
          <Link
            className="inline-flex items-center justify-center rounded-md bg-blue-500 px-5 py-2 text-white hover:shadow-lg hover:shadow-blue-500/40"
            to="/seller/dashboard/products"
          >
            Back To Products
          </Link>
        </div>

        {isApproved && (
          <div className="mb-5 rounded-lg border border-yellow-500 bg-yellow-500/15 px-4 py-3 text-yellow-200">
            This product is approved and locked. Seller cannot edit it.
          </div>
        )}

        <form onSubmit={update} className="space-y-6">
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
                      disabled={isApproved}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
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
                      disabled={isApproved}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
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
                      onClick={() => !isApproved && setCateShow(!cateShow)}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
                      value={category}
                      type="text"
                      placeholder="--select category--"
                      id="category"
                      disabled={isApproved}
                    />

                    <div
                      className={`absolute top-[101%] left-0 z-20 bg-slate-800 w-full rounded-md border border-slate-700 origin-top transition-all ${
                        cateShow ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                      }`}
                    >
                      <div className="w-full px-3 py-3 border-b border-slate-700">
                        <input
                          disabled={isApproved}
                          value={searchValue}
                          onChange={categorySearch}
                          className="px-3 py-2 w-full focus:border-indigo-500 outline-none bg-transparent border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
                          type="text"
                          placeholder="Search category"
                        />
                      </div>
                      <div className="max-h-[220px] overflow-y-auto">
                        {allCategory.length > 0 &&
                          allCategory.map((c) => (
                            <span
                              key={c._id}
                              className={`px-4 py-2 hover:bg-indigo-500 hover:text-white w-full cursor-pointer block ${
                                category === c.name ? "bg-indigo-500 text-white" : ""
                              }`}
                              onClick={() => {
                                setCateShow(false);
                                setCategory(c.name);
                                setCategoryId(c._id);
                                setSelectedOptions({});
                                setVariantCombinations([]);
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
                      disabled={isApproved}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
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
                      disabled={isApproved}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
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
                      disabled={isApproved}
                      className="px-4 py-2 focus:border-indigo-500 outline-none bg-[#283046] border border-slate-700 rounded-md text-[#d0d2d6] disabled:opacity-60"
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
                  Variations
                </h2>
                {(variationConfig.variations || []).filter((v) => v.isActive !== false).length ? (
                  <div className="space-y-4">
                    {(variationConfig.variations || [])
                      .filter((variation) => variation.isActive !== false)
                      .map((variation) => (
                        <div key={variation.name}>
                          <p className="mb-2 text-sm text-slate-300">
                            {variation.label || variation.name}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {(variation.options || [])
                              .filter((option) => option.isActive !== false)
                              .map((option) => {
                                const active = (selectedOptions[variation.name] || []).includes(option.value);
                                return (
                                  <button
                                    key={`${variation.name}-${option.value}`}
                                    disabled={isApproved}
                                    type="button"
                                    onClick={() => toggleOption(variation, option)}
                                    className={`rounded-md border px-3 py-2 text-sm disabled:opacity-60 ${
                                      active
                                        ? "border-indigo-500 bg-indigo-500 text-white"
                                        : "border-slate-700 bg-[#283046] text-[#d0d2d6]"
                                    }`}
                                  >
                                    {option.group ? `${option.group} - ` : ""}{option.label}
                                  </button>
                                );
                              })}
                          </div>
                        </div>
                      ))}

                    {variantCombinations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-300">Available combinations</p>
                        {variantCombinations.map((combo) => (
                          <div key={combo.variantKey} className="grid grid-cols-1 gap-2 rounded-md border border-slate-700 p-3 md:grid-cols-[1fr_100px_100px_80px]">
                            <span className="text-sm text-slate-300">
                              {(combo.attributes || []).map((item) => item.optionLabel || item.value).join(" / ")}
                            </span>
                            <input disabled={isApproved} className="rounded-md border border-slate-700 bg-[#283046] px-3 py-2 text-[#d0d2d6] disabled:opacity-60" placeholder="Stock" value={combo.stock ?? ""} onChange={(e) => updateCombination(combo.variantKey, "stock", e.target.value)} />
                            <input disabled={isApproved} className="rounded-md border border-slate-700 bg-[#283046] px-3 py-2 text-[#d0d2d6] disabled:opacity-60" placeholder="Price" value={combo.price ?? ""} onChange={(e) => updateCombination(combo.variantKey, "price", e.target.value)} />
                            <label className="flex items-center gap-2 text-sm text-slate-300">
                              <input disabled={isApproved} checked={combo.isActive !== false} onChange={(e) => updateCombination(combo.variantKey, "isActive", e.target.checked)} type="checkbox" />
                              Active
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No variations configured for this category.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-700 bg-[#1f2d44] p-4 md:p-5">
                <h2 className="mb-4 text-[#d0d2d6] font-medium text-base">
                  Delivery Pincodes
                </h2>
                <textarea
                  disabled={isApproved}
                  className="min-h-[96px] w-full rounded-md border border-slate-700 bg-[#283046] px-4 py-2 text-[#d0d2d6] outline-none focus:border-indigo-500 disabled:opacity-60"
                  value={pincodeText}
                  onChange={(e) => setPincodeText(e.target.value)}
                  placeholder="Enter pincodes separated by comma, space, or new line"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Leave empty to keep delivery available by default.
                </p>
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
                    <span className="text-slate-400">Approval:</span>{" "}
                    <span className="capitalize">{product?.approval_status || "pending"}</span>
                  </p>
                  <p>
                    <span className="text-slate-400">Images:</span> {imageShow.length}
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
                    {imageWarningCount} replacement image(s) need careful framing
                    before they are saved as square product images.
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-2">
                  {imageShow &&
                    imageShow.length > 0 &&
                    imageShow.map((img, i) => (
                      <div key={img.id} className="rounded-md overflow-hidden border border-slate-700">
                        <label
                          className="block relative cursor-pointer"
                          htmlFor={`product-image-${img.id}`}
                        >
                          <div className="relative">
                            <ProductImage
                              alt={img.name}
                              className="w-full"
                              imgClassName="p-2"
                              src={img.url}
                            />
                          </div>
                          {!isApproved && (
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-all flex items-center justify-center text-xs text-white">
                              Change Image
                            </div>
                          )}
                        </label>
                        <input
                          disabled={isApproved}
                          accept={PRODUCT_IMAGE_ACCEPT}
                          onChange={(e) => {
                            changeImage(e.target.files, i);
                            e.target.value = "";
                          }}
                          type="file"
                          id={`product-image-${img.id}`}
                          className="hidden"
                        />
                        <div className="space-y-1 border-t border-slate-700 bg-[#162235] p-2">
                          <p className="truncate text-xs text-slate-300">{img.name}</p>
                          {img.originalWidth && img.originalHeight && (
                            <p className="text-[11px] text-slate-400">
                              Original: {img.originalWidth} x {img.originalHeight}px
                            </p>
                          )}
                          {img.outputWidth && img.outputHeight && (
                            <p className="text-[11px] text-slate-400">
                              Output: {img.outputWidth} x {img.outputHeight}px
                            </p>
                          )}
                          <p className="text-[11px] text-slate-400">
                            Mode: {img.mode === "cropped" ? "Square crop" : "Original fit"}
                          </p>
                          {img.warnings?.map((warning) => (
                            <p key={`${img.id}-${warning}`} className="text-[11px] text-amber-300">
                              {warning}
                            </p>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-start">
            <button
              disabled={loader || isApproved}
              className="inline-flex items-center justify-center gap-2 bg-blue-500 w-[210px] hover:shadow-blue-500/20 hover:shadow-lg text-white rounded-md px-7 py-2 disabled:opacity-60"
            >
              {loader ? (
                <PropagateLoader color="#fff" cssOverride={overrideStyle} />
              ) : isApproved ? (
                "Product Locked"
              ) : (
                <>
                  <FiSave />
                  Update Product
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

export default EditProduct;
