/* @ds-bundle: {"format":4,"namespace":"SportCraftDesignSystem_1803c2","components":[{"name":"Badge","sourcePath":"components/core/Badge.jsx"},{"name":"Button","sourcePath":"components/core/Button.jsx"},{"name":"Card","sourcePath":"components/core/Card.jsx"},{"name":"Icon","sourcePath":"components/core/Icon.jsx"},{"name":"IconButton","sourcePath":"components/core/IconButton.jsx"},{"name":"SpecList","sourcePath":"components/core/SpecList.jsx"},{"name":"StatBlock","sourcePath":"components/core/StatBlock.jsx"},{"name":"Tag","sourcePath":"components/core/Tag.jsx"},{"name":"Dialog","sourcePath":"components/feedback/Dialog.jsx"},{"name":"ProgressBar","sourcePath":"components/feedback/ProgressBar.jsx"},{"name":"Toast","sourcePath":"components/feedback/Toast.jsx"},{"name":"Tooltip","sourcePath":"components/feedback/Tooltip.jsx"},{"name":"Checkbox","sourcePath":"components/forms/Checkbox.jsx"},{"name":"Field","sourcePath":"components/forms/Field.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"RadioGroup","sourcePath":"components/forms/RadioGroup.jsx"},{"name":"Select","sourcePath":"components/forms/Select.jsx"},{"name":"Switch","sourcePath":"components/forms/Switch.jsx"},{"name":"Breadcrumbs","sourcePath":"components/navigation/Breadcrumbs.jsx"},{"name":"SideNav","sourcePath":"components/navigation/SideNav.jsx"},{"name":"Tabs","sourcePath":"components/navigation/Tabs.jsx"}],"sourceHashes":{"components/core/Badge.jsx":"866efc262a4c","components/core/Button.jsx":"bcad3b2a16f4","components/core/Card.jsx":"ac26c2dab703","components/core/Icon.jsx":"34c22b089d46","components/core/IconButton.jsx":"651548287be1","components/core/SpecList.jsx":"7decac5e4b00","components/core/StatBlock.jsx":"d286917b38d7","components/core/Tag.jsx":"de2792d0755a","components/feedback/Dialog.jsx":"7140743196e5","components/feedback/ProgressBar.jsx":"d81d49859cd2","components/feedback/Toast.jsx":"d85eabc127f4","components/feedback/Tooltip.jsx":"34a7421cd6c0","components/forms/Checkbox.jsx":"fc1d4de91060","components/forms/Field.jsx":"b0660bfaf727","components/forms/Input.jsx":"bdb0bfac6e6f","components/forms/RadioGroup.jsx":"14ca2aa14a92","components/forms/Select.jsx":"1d530de7792a","components/forms/Switch.jsx":"a5c8a1413897","components/navigation/Breadcrumbs.jsx":"4b9ccc2c54b1","components/navigation/SideNav.jsx":"9723c14efb73","components/navigation/Tabs.jsx":"155792a881eb","ui_kits/website/Booking.jsx":"82fbf6116303","ui_kits/website/Home.jsx":"874f8d767961","ui_kits/website/Services.jsx":"0cf5abbac5a5","ui_kits/website/SiteChrome.jsx":"340164ce4f89","ui_kits/website/site.jsx":"4993c0b750d8","ui_kits/workshop-app/AppShell.jsx":"7ad6ab16c6a1","ui_kits/workshop-app/Customers.jsx":"025a486b6304","ui_kits/workshop-app/JobDetail.jsx":"5b42f5980294","ui_kits/workshop-app/JobQueue.jsx":"4657c976ff7c","ui_kits/workshop-app/StringStock.jsx":"826b7dafee1c","ui_kits/workshop-app/app.jsx":"d45b66544f54"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.SportCraftDesignSystem_1803c2 = window.SportCraftDesignSystem_1803c2 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/core/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  neutral: {
    background: "var(--ink-050)",
    color: "var(--ink-700)",
    border: "var(--ink-100)"
  },
  brand: {
    background: "var(--court-050)",
    color: "var(--court-700)",
    border: "var(--court-100)"
  },
  success: {
    background: "var(--signal-success-bg)",
    color: "var(--signal-success)",
    border: "#C4E3D3"
  },
  warning: {
    background: "var(--signal-warning-bg)",
    color: "var(--signal-warning)",
    border: "#EEDCAE"
  },
  danger: {
    background: "var(--signal-danger-bg)",
    color: "var(--signal-danger)",
    border: "#EFCBC6"
  },
  info: {
    background: "var(--signal-info-bg)",
    color: "var(--signal-info)",
    border: "#CBD8EE"
  },
  accent: {
    background: "var(--optic-100)",
    color: "#5C6B12",
    border: "var(--optic-200)"
  }
};
function Badge({
  children,
  tone = "neutral",
  dot = false,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      height: 22,
      padding: "0 8px",
      borderRadius: "var(--radius-xs)",
      background: t.background,
      color: t.color,
      border: "1px solid " + t.border,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-s)",
      letterSpacing: "var(--ls-mono-s)",
      textTransform: "uppercase",
      whiteSpace: "nowrap",
      ...style
    }
  }, rest), dot ? /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: t.color
    }
  }) : null, children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Badge.jsx", error: String((e && e.message) || e) }); }

// components/core/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Card({
  children,
  padding = "var(--space-3)",
  tone = "default",
  interactive = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const tones = {
    default: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)"
    },
    sunken: {
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-hairline)"
    },
    brand: {
      background: "var(--surface-brand-soft)",
      border: "1px solid var(--court-200)"
    },
    inverse: {
      background: "var(--surface-inverse)",
      border: "1px solid var(--ink-800)",
      color: "var(--text-inverse)"
    }
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      borderRadius: "var(--radius-md)",
      padding,
      boxShadow: interactive && hover ? "var(--shadow-2)" : "var(--shadow-1)",
      borderColor: interactive && hover ? "var(--border-subtle)" : undefined,
      cursor: interactive ? "pointer" : undefined,
      transition: "box-shadow var(--duration-fast) var(--ease-standard), border-color var(--duration-fast) var(--ease-standard)",
      ...tones[tone],
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Card.jsx", error: String((e && e.message) || e) }); }

// components/core/Icon.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const ALIAS = {
  "check-circle-2": "circle-check",
  "alert-circle": "circle-alert",
  "alert-triangle": "triangle-alert",
  "circle-check-big": "circle-check"
};
const pascal = s => s.split("-").map(p => p.charAt(0).toUpperCase() + p.slice(1)).join("");

/* Lucide icons, loaded from CDN by the host page:
   <script src="https://unpkg.com/lucide@0.544.0/dist/umd/lucide.min.js"></script>
   The wrapper exists so every icon in the system gets the same size + stroke. */
function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  color = "currentColor",
  style,
  ...rest
}) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    const L = window.lucide;
    if (!el || !L) return;
    el.innerHTML = "";
    const key = pascal(ALIAS[name] || name);
    const node = L.icons && (L.icons[key] || L.icons[pascal(name)]) || L[key];
    if (node && L.createElement) {
      const svg = L.createElement(node);
      svg.setAttribute("width", size);
      svg.setAttribute("height", size);
      svg.setAttribute("stroke-width", strokeWidth);
      svg.setAttribute("stroke", color);
      el.appendChild(svg);
      return;
    }
    if (L.createIcons) {
      const span = document.createElement("span");
      span.setAttribute("data-lucide", ALIAS[name] || name);
      el.appendChild(span);
      try {
        L.createIcons({
          icons: L.icons,
          nameAttr: "data-lucide",
          attrs: {
            width: size,
            height: size,
            "stroke-width": strokeWidth,
            stroke: color
          }
        });
      } catch (e) {
        el.innerHTML = "";
      }
    }
  }, [name, size, strokeWidth, color]);
  return /*#__PURE__*/React.createElement("span", _extends({
    ref: ref,
    "aria-hidden": "true",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      flex: "0 0 auto",
      color,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Icon.jsx", error: String((e && e.message) || e) }); }

// components/core/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    height: 30,
    padding: "0 12px",
    font: "var(--text-body-s)",
    gap: 6,
    icon: 15
  },
  md: {
    height: 38,
    padding: "0 16px",
    font: "var(--text-body-m)",
    gap: 8,
    icon: 17
  },
  lg: {
    height: 46,
    padding: "0 22px",
    font: "var(--text-body-l)",
    gap: 10,
    icon: 19
  }
};
function palette(variant, state) {
  const p = {
    primary: {
      base: {
        background: "var(--action-primary-bg)",
        color: "var(--action-primary-fg)",
        border: "1px solid var(--action-primary-bg)"
      },
      hover: {
        background: "var(--action-primary-bg-hover)",
        borderColor: "var(--action-primary-bg-hover)"
      },
      active: {
        background: "var(--action-primary-bg-active)",
        borderColor: "var(--action-primary-bg-active)"
      }
    },
    secondary: {
      base: {
        background: "var(--action-secondary-bg)",
        color: "var(--action-secondary-fg)",
        border: "1px solid var(--border-subtle)"
      },
      hover: {
        background: "var(--paper-100)",
        borderColor: "var(--ink-300)"
      },
      active: {
        background: "var(--paper-200)",
        borderColor: "var(--ink-400)"
      }
    },
    ghost: {
      base: {
        background: "transparent",
        color: "var(--action-ghost-fg)",
        border: "1px solid transparent"
      },
      hover: {
        background: "var(--paper-100)"
      },
      active: {
        background: "var(--paper-200)"
      }
    },
    accent: {
      base: {
        background: "var(--surface-accent)",
        color: "var(--court-900)",
        border: "1px solid var(--optic-500)"
      },
      hover: {
        background: "var(--optic-500)",
        borderColor: "var(--optic-600)"
      },
      active: {
        background: "var(--optic-600)",
        borderColor: "var(--optic-600)"
      }
    },
    danger: {
      base: {
        background: "var(--signal-danger)",
        color: "var(--paper-000)",
        border: "1px solid var(--signal-danger)"
      },
      hover: {
        background: "#98291F",
        borderColor: "#98291F"
      },
      active: {
        background: "#7F2019",
        borderColor: "#7F2019"
      }
    }
  }[variant] || {};
  return {
    ...p.base,
    ...(state === "hover" ? p.hover : null),
    ...(state === "active" ? p.active : null)
  };
}
function Button({
  children,
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  disabled = false,
  fullWidth = false,
  type = "button",
  style,
  ...rest
}) {
  const [state, setState] = React.useState(null);
  const s = SIZES[size] || SIZES.md;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onMouseEnter: () => setState("hover"),
    onMouseLeave: () => setState(null),
    onMouseDown: () => setState("active"),
    onMouseUp: () => setState("hover"),
    style: {
      display: fullWidth ? "flex" : "inline-flex",
      width: fullWidth ? "100%" : undefined,
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.height,
      padding: s.padding,
      fontFamily: "var(--font-body)",
      fontSize: s.font,
      fontWeight: "var(--weight-medium)",
      letterSpacing: "-0.003em",
      lineHeight: 1,
      whiteSpace: "nowrap",
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "var(--transition-control)",
      ...palette(variant, disabled ? null : state),
      ...(disabled ? {
        background: "var(--action-disabled-bg)",
        color: "var(--action-disabled-fg)",
        border: "1px solid var(--ink-100)"
      } : null),
      ...style
    }
  }, rest), iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: s.icon
  }) : null, children, iconRight ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconRight,
    size: s.icon
  }) : null);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Button.jsx", error: String((e && e.message) || e) }); }

// components/core/IconButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SIZES = {
  sm: {
    box: 30,
    icon: 16
  },
  md: {
    box: 38,
    icon: 18
  },
  lg: {
    box: 46,
    icon: 20
  }
};
function IconButton({
  icon,
  label,
  variant = "ghost",
  size = "md",
  disabled = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.md;
  const skin = {
    ghost: {
      background: hover ? "var(--paper-100)" : "transparent",
      color: "var(--ink-700)",
      border: "1px solid transparent"
    },
    outline: {
      background: hover ? "var(--paper-100)" : "var(--paper-000)",
      color: "var(--ink-800)",
      border: "1px solid var(--border-subtle)"
    },
    solid: {
      background: hover ? "var(--action-primary-bg-hover)" : "var(--action-primary-bg)",
      color: "var(--paper-000)",
      border: "1px solid transparent"
    }
  }[variant];
  return /*#__PURE__*/React.createElement("button", _extends({
    type: "button",
    "aria-label": label,
    title: label,
    disabled: disabled,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: s.box,
      height: s.box,
      borderRadius: "var(--radius-sm)",
      cursor: disabled ? "not-allowed" : "pointer",
      transition: "var(--transition-control)",
      ...skin,
      ...(disabled ? {
        background: "var(--action-disabled-bg)",
        color: "var(--action-disabled-fg)",
        border: "1px solid var(--ink-100)"
      } : null),
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: s.icon
  }));
}
Object.assign(__ds_scope, { IconButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/IconButton.jsx", error: String((e && e.message) || e) }); }

// components/core/SpecList.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SpecList({
  items = [],
  dense = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("dl", _extends({
    style: {
      margin: 0,
      display: "grid",
      gridTemplateColumns: "minmax(0,auto) minmax(0,1fr)",
      ...style
    }
  }, rest), items.map((it, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: it.label + i
  }, /*#__PURE__*/React.createElement("dt", {
    style: {
      padding: dense ? "7px 20px 7px 0" : "11px 24px 11px 0",
      borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)",
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      letterSpacing: "var(--ls-label)",
      textTransform: "uppercase",
      color: "var(--text-muted)",
      whiteSpace: "nowrap"
    }
  }, it.label), /*#__PURE__*/React.createElement("dd", {
    style: {
      margin: 0,
      padding: dense ? "7px 0" : "11px 0",
      borderTop: i === 0 ? "none" : "1px solid var(--border-hairline)",
      fontFamily: "var(--font-body)",
      fontSize: dense ? "var(--text-body-s)" : "var(--text-body-m)",
      color: "var(--text-primary)",
      textAlign: "right",
      fontVariantNumeric: "tabular-nums"
    }
  }, it.value))));
}
Object.assign(__ds_scope, { SpecList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/SpecList.jsx", error: String((e && e.message) || e) }); }

// components/core/StatBlock.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function StatBlock({
  label,
  value,
  unit,
  delta,
  deltaTone = "neutral",
  icon,
  style,
  ...rest
}) {
  const tones = {
    up: "var(--signal-success)",
    down: "var(--signal-danger)",
    neutral: "var(--ink-400)"
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: icon,
    size: 14,
    color: "var(--ink-400)"
  }) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      letterSpacing: "var(--ls-label)",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-display-m)",
      lineHeight: 1,
      letterSpacing: "var(--ls-display-m)",
      fontWeight: "var(--weight-semibold)",
      fontVariantNumeric: "tabular-nums",
      color: "var(--text-primary)"
    }
  }, value), unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-m)",
      color: "var(--text-muted)"
    }
  }, unit) : null, delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      marginLeft: 2,
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-s)",
      color: tones[deltaTone]
    }
  }, delta) : null));
}
Object.assign(__ds_scope, { StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/StatBlock.jsx", error: String((e && e.message) || e) }); }

// components/core/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tag({
  children,
  color = "var(--ink-400)",
  onRemove,
  selected = false,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(false);
  return /*#__PURE__*/React.createElement("span", _extends({
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 26,
      padding: onRemove ? "0 6px 0 10px" : "0 10px",
      borderRadius: "var(--radius-pill)",
      background: selected ? "var(--court-050)" : hover ? "var(--paper-100)" : "var(--paper-000)",
      border: "1px solid " + (selected ? "var(--court-300)" : "var(--border-subtle)"),
      color: "var(--ink-800)",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-s)",
      transition: "var(--transition-control)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "50%",
      background: color,
      flex: "0 0 auto"
    }
  }), children, onRemove ? /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: onRemove,
    "aria-label": "Remove",
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: 16,
      height: 16,
      border: "none",
      background: "transparent",
      color: "var(--ink-400)",
      cursor: "pointer",
      padding: 0
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "x",
    size: 12
  })) : null);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/core/Tag.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Dialog.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Dialog({
  open = false,
  title,
  description,
  children,
  footer,
  onClose,
  width = 480,
  style,
  ...rest
}) {
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(7,35,28,0.38)",
      backdropFilter: "blur(2px)",
      padding: "var(--space-3)",
      zIndex: 40
    },
    onClick: onClose
  }, /*#__PURE__*/React.createElement("div", _extends({
    onClick: e => e.stopPropagation(),
    style: {
      width: "100%",
      maxWidth: width,
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-overlay)",
      overflow: "hidden",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 16,
      padding: "20px 20px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: "var(--text-heading-m)",
      lineHeight: "var(--lh-heading-m)",
      letterSpacing: "var(--ls-heading-m)",
      fontWeight: "var(--weight-semibold)",
      margin: 0
    }
  }, title), description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: 0,
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-m)",
      lineHeight: "var(--lh-body-m)",
      color: "var(--text-secondary)"
    }
  }, description) : null), /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Close",
    size: "sm",
    onClick: onClose
  })), children ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 20px 0"
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      padding: "20px",
      marginTop: 20,
      borderTop: "1px solid var(--border-hairline)",
      background: "var(--paper-050)"
    }
  }, footer) : /*#__PURE__*/React.createElement("div", {
    style: {
      height: 20
    }
  })));
}
Object.assign(__ds_scope, { Dialog });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Dialog.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ProgressBar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueLabel,
  tone = "brand",
  height = 6,
  style,
  ...rest
}) {
  const pct = Math.max(0, Math.min(100, value / max * 100));
  const fill = {
    brand: "var(--court-600)",
    accent: "var(--optic-500)",
    warning: "var(--signal-warning)",
    danger: "var(--signal-danger)"
  }[tone];
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 7,
      ...style
    }
  }, rest), label || valueLabel ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      letterSpacing: "var(--ls-label)",
      textTransform: "uppercase",
      color: "var(--text-muted)"
    }
  }, label), valueLabel ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-s)",
      color: "var(--text-secondary)",
      fontVariantNumeric: "tabular-nums"
    }
  }, valueLabel) : null) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      borderRadius: "var(--radius-pill)",
      background: "var(--ink-100)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: fill,
      borderRadius: "var(--radius-pill)",
      transition: "width var(--duration-base) var(--ease-standard)"
    }
  })));
}
Object.assign(__ds_scope, { ProgressBar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ProgressBar.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Toast.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const TONES = {
  success: {
    icon: "circle-check",
    color: "var(--signal-success)"
  },
  danger: {
    icon: "circle-alert",
    color: "var(--signal-danger)"
  },
  warning: {
    icon: "triangle-alert",
    color: "var(--signal-warning)"
  },
  info: {
    icon: "info",
    color: "var(--signal-info)"
  }
};
function Toast({
  title,
  message,
  tone = "info",
  onDismiss,
  action,
  style,
  ...rest
}) {
  const t = TONES[tone] || TONES.info;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12,
      width: "100%",
      maxWidth: 380,
      padding: "12px 12px 12px 14px",
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderLeft: "none",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-3)",
      backgroundImage: "linear-gradient(to right, " + t.color + " 0 3px, transparent 3px)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 1
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: t.icon,
    size: 17,
    color: t.color
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column",
      gap: 3
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-m)",
      fontWeight: "var(--weight-medium)",
      color: "var(--text-primary)"
    }
  }, title), message ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-s)",
      lineHeight: 1.45,
      color: "var(--text-secondary)"
    }
  }, message) : null, action ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6
    }
  }, action) : null), onDismiss ? /*#__PURE__*/React.createElement(__ds_scope.IconButton, {
    icon: "x",
    label: "Dismiss",
    size: "sm",
    onClick: onDismiss
  }) : null);
}
Object.assign(__ds_scope, { Toast });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Toast.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tooltip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tooltip({
  label,
  placement = "top",
  children,
  style,
  ...rest
}) {
  const [show, setShow] = React.useState(false);
  const pos = {
    top: {
      bottom: "calc(100% + 7px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    bottom: {
      top: "calc(100% + 7px)",
      left: "50%",
      transform: "translateX(-50%)"
    },
    left: {
      right: "calc(100% + 7px)",
      top: "50%",
      transform: "translateY(-50%)"
    },
    right: {
      left: "calc(100% + 7px)",
      top: "50%",
      transform: "translateY(-50%)"
    }
  }[placement];
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      position: "relative",
      display: "inline-flex",
      ...style
    },
    onMouseEnter: () => setShow(true),
    onMouseLeave: () => setShow(false)
  }, rest), children, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      ...pos,
      zIndex: 30,
      pointerEvents: "none",
      opacity: show ? 1 : 0,
      transition: "opacity var(--duration-fast) var(--ease-standard)",
      padding: "5px 8px",
      borderRadius: "var(--radius-xs)",
      background: "var(--ink-900)",
      color: "var(--paper-050)",
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-s)",
      whiteSpace: "nowrap",
      boxShadow: "var(--shadow-2)"
    }
  }, label));
}
Object.assign(__ds_scope, { Tooltip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tooltip.jsx", error: String((e && e.message) || e) }); }

// components/forms/Checkbox.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Checkbox({
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const isOn = checked === undefined ? internal : checked;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!isOn);
    onChange && onChange(!isOn);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "flex-start",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "0 0 auto",
      width: 18,
      height: 18,
      marginTop: 1,
      borderRadius: "var(--radius-xs)",
      background: isOn ? "var(--court-700)" : "var(--paper-000)",
      border: "1px solid " + (isOn ? "var(--court-700)" : "var(--ink-300)"),
      transition: "var(--transition-control)"
    }
  }, isOn ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "check",
    size: 13,
    strokeWidth: 2.5,
    color: "var(--paper-000)"
  }) : null), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-m)",
      color: "var(--text-primary)"
    }
  }, label), description ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-s)",
      color: "var(--text-muted)"
    }
  }, description) : null));
}
Object.assign(__ds_scope, { Checkbox });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Checkbox.jsx", error: String((e && e.message) || e) }); }

// components/forms/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field({
  label,
  hint,
  error,
  required = false,
  htmlFor,
  children,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6,
      ...style
    }
  }, rest), label ? /*#__PURE__*/React.createElement("label", {
    htmlFor: htmlFor,
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-label)",
      letterSpacing: "var(--ls-label)",
      textTransform: "uppercase",
      color: "var(--ink-600)",
      display: "inline-flex",
      gap: 5
    }
  }, label, required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--clay-600)"
    }
  }, "*") : null) : null, children, error ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-s)",
      color: "var(--signal-danger)"
    }
  }, error) : hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-s)",
      color: "var(--text-muted)"
    }
  }, hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Field.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Input({
  iconLeft,
  suffix,
  invalid = false,
  disabled = false,
  size = "md",
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "sm" ? 32 : size === "lg" ? 46 : 38;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 160,
      height: h,
      padding: "0 12px",
      background: disabled ? "var(--ink-050)" : "var(--paper-000)",
      border: "1px solid " + (invalid ? "var(--signal-danger)" : focus ? "var(--court-500)" : "var(--border-subtle)"),
      borderRadius: "var(--radius-sm)",
      boxShadow: focus ? "0 0 0 3px rgba(21,107,82,0.12)" : "none",
      transition: "var(--transition-control)",
      ...style
    }
  }, iconLeft ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: iconLeft,
    size: 16,
    color: "var(--ink-400)"
  }) : null, /*#__PURE__*/React.createElement("input", _extends({
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      flex: 1,
      minWidth: 0,
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-body)",
      fontSize: size === "sm" ? "var(--text-body-s)" : "var(--text-body-m)",
      color: disabled ? "var(--ink-400)" : "var(--text-primary)"
    }
  }, rest)), suffix ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: "var(--text-mono-s)",
      color: "var(--text-muted)",
      textTransform: "uppercase"
    }
  }, suffix) : null);
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/forms/RadioGroup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function RadioGroup({
  name,
  options = [],
  value,
  defaultValue,
  onChange,
  direction = "column",
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(defaultValue);
  const current = value === undefined ? internal : value;
  const pick = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "radiogroup",
    style: {
      display: "flex",
      flexDirection: direction,
      gap: direction === "row" ? 20 : 12,
      ...style
    }
  }, rest), options.map(o => {
    const v = typeof o === "string" ? o : o.value;
    const label = typeof o === "string" ? o : o.label;
    const description = typeof o === "string" ? null : o.description;
    const on = current === v;
    return /*#__PURE__*/React.createElement("label", {
      key: v,
      onClick: () => pick(v),
      style: {
        display: "inline-flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flex: "0 0 auto",
        width: 18,
        height: 18,
        marginTop: 1,
        borderRadius: "50%",
        background: "var(--paper-000)",
        border: on ? "1.5px solid var(--court-700)" : "1px solid var(--ink-300)",
        transition: "var(--transition-control)"
      }
    }, on ? /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--court-700)"
      }
    }) : null), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        flexDirection: "column",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-body-m)",
        color: "var(--text-primary)"
      }
    }, label), description ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-body-s)",
        color: "var(--text-muted)"
      }
    }, description) : null), /*#__PURE__*/React.createElement("input", {
      type: "radio",
      name: name,
      value: v,
      checked: on,
      readOnly: true,
      style: {
        position: "absolute",
        opacity: 0,
        pointerEvents: "none"
      }
    }));
  }));
}
Object.assign(__ds_scope, { RadioGroup });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/RadioGroup.jsx", error: String((e && e.message) || e) }); }

// components/forms/Select.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Select({
  options = [],
  size = "md",
  invalid = false,
  disabled = false,
  style,
  ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const h = size === "sm" ? 32 : size === "lg" ? 46 : 38;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      alignItems: "center",
      minWidth: 0,
      height: h,
      background: disabled ? "var(--ink-050)" : "var(--paper-000)",
      border: "1px solid " + (invalid ? "var(--signal-danger)" : focus ? "var(--court-500)" : "var(--border-subtle)"),
      borderRadius: "var(--radius-sm)",
      boxShadow: focus ? "0 0 0 3px rgba(21,107,82,0.12)" : "none",
      transition: "var(--transition-control)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("select", _extends({
    disabled: disabled,
    onFocus: () => setFocus(true),
    onBlur: () => setFocus(false),
    style: {
      appearance: "none",
      WebkitAppearance: "none",
      flex: 1,
      minWidth: 0,
      height: "100%",
      padding: "0 34px 0 12px",
      border: "none",
      outline: "none",
      background: "transparent",
      fontFamily: "var(--font-body)",
      fontSize: size === "sm" ? "var(--text-body-s)" : "var(--text-body-m)",
      color: disabled ? "var(--ink-400)" : "var(--text-primary)",
      cursor: disabled ? "not-allowed" : "pointer"
    }
  }, rest), options.map(o => {
    const value = typeof o === "string" ? o : o.value;
    const label = typeof o === "string" ? o : o.label;
    return /*#__PURE__*/React.createElement("option", {
      key: value,
      value: value
    }, label);
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      right: 11,
      display: "flex",
      pointerEvents: "none"
    }
  }, /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "chevron-down",
    size: 16,
    color: "var(--ink-400)"
  })));
}
Object.assign(__ds_scope, { Select });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Select.jsx", error: String((e && e.message) || e) }); }

// components/forms/Switch.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Switch({
  label,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  style,
  ...rest
}) {
  const [internal, setInternal] = React.useState(!!defaultChecked);
  const on = checked === undefined ? internal : checked;
  const toggle = () => {
    if (disabled) return;
    if (checked === undefined) setInternal(!on);
    onChange && onChange(!on);
  };
  return /*#__PURE__*/React.createElement("label", _extends({
    onClick: toggle,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.55 : 1,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "relative",
      width: 38,
      height: 22,
      flex: "0 0 auto",
      borderRadius: "var(--radius-pill)",
      background: on ? "var(--court-600)" : "var(--ink-200)",
      transition: "background-color var(--duration-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 3,
      left: on ? 19 : 3,
      width: 16,
      height: 16,
      borderRadius: "50%",
      background: "var(--paper-000)",
      boxShadow: "var(--shadow-1)",
      transition: "left var(--duration-fast) var(--ease-standard)"
    }
  })), label ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-body)",
      fontSize: "var(--text-body-m)",
      color: "var(--text-primary)"
    }
  }, label) : null);
}
Object.assign(__ds_scope, { Switch });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Switch.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Breadcrumbs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Breadcrumbs({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
      ...style
    }
  }, rest), items.map((it, i) => {
    const last = i === items.length - 1;
    const label = typeof it === "string" ? it : it.label;
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: label + i
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-body-s)",
        color: last ? "var(--text-primary)" : "var(--text-muted)",
        fontWeight: last ? "var(--weight-medium)" : "var(--weight-regular)",
        cursor: last ? "default" : "pointer"
      }
    }, label), last ? null : /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: "chevron-right",
      size: 13,
      color: "var(--ink-300)"
    }));
  }));
}
Object.assign(__ds_scope, { Breadcrumbs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Breadcrumbs.jsx", error: String((e && e.message) || e) }); }

// components/navigation/SideNav.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SideNav({
  items = [],
  value,
  onChange,
  footer,
  style,
  ...rest
}) {
  const [hover, setHover] = React.useState(null);
  return /*#__PURE__*/React.createElement("nav", _extends({
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      ...style
    }
  }, rest), items.map(it => {
    if (it.section) {
      return /*#__PURE__*/React.createElement("div", {
        key: "s-" + it.section,
        style: {
          padding: "18px 10px 8px",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-label-s)",
          letterSpacing: "var(--ls-label-s)",
          textTransform: "uppercase",
          color: "var(--ink-400)"
        }
      }, it.section);
    }
    const on = value === it.value;
    return /*#__PURE__*/React.createElement("button", {
      key: it.value,
      type: "button",
      onClick: () => onChange && onChange(it.value),
      onMouseEnter: () => setHover(it.value),
      onMouseLeave: () => setHover(null),
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        height: 36,
        padding: "0 10px",
        borderRadius: "var(--radius-sm)",
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        background: on ? "var(--court-050)" : hover === it.value ? "var(--paper-100)" : "transparent",
        color: on ? "var(--court-700)" : "var(--ink-700)",
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-body-m)",
        fontWeight: on ? "var(--weight-medium)" : "var(--weight-regular)",
        transition: "var(--transition-control)"
      }
    }, it.icon ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
      name: it.icon,
      size: 17
    }) : null, /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        minWidth: 0,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, it.label), it.count !== undefined ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-s)",
        color: on ? "var(--court-600)" : "var(--ink-400)",
        fontVariantNumeric: "tabular-nums"
      }
    }, it.count) : null);
  }), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto"
    }
  }, footer) : null);
}
Object.assign(__ds_scope, { SideNav });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/SideNav.jsx", error: String((e && e.message) || e) }); }

// components/navigation/Tabs.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Tabs({
  items = [],
  value,
  defaultValue,
  onChange,
  style,
  ...rest
}) {
  const first = items[0] && (typeof items[0] === "string" ? items[0] : items[0].value);
  const [internal, setInternal] = React.useState(defaultValue ?? first);
  const [hover, setHover] = React.useState(null);
  const current = value === undefined ? internal : value;
  const pick = v => {
    if (value === undefined) setInternal(v);
    onChange && onChange(v);
  };
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "tablist",
    style: {
      display: "flex",
      gap: 2,
      borderBottom: "1px solid var(--border-hairline)",
      ...style
    }
  }, rest), items.map(it => {
    const v = typeof it === "string" ? it : it.value;
    const label = typeof it === "string" ? it : it.label;
    const count = typeof it === "string" ? null : it.count;
    const on = current === v;
    return /*#__PURE__*/React.createElement("button", {
      key: v,
      role: "tab",
      "aria-selected": on,
      type: "button",
      onClick: () => pick(v),
      onMouseEnter: () => setHover(v),
      onMouseLeave: () => setHover(null),
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "0 12px",
        height: 38,
        background: "transparent",
        border: "none",
        cursor: "pointer",
        borderBottom: "2px solid " + (on ? "var(--court-600)" : "transparent"),
        marginBottom: -1,
        fontFamily: "var(--font-body)",
        fontSize: "var(--text-body-m)",
        fontWeight: on ? "var(--weight-medium)" : "var(--weight-regular)",
        color: on ? "var(--text-primary)" : hover === v ? "var(--ink-700)" : "var(--text-muted)",
        transition: "var(--transition-control)"
      }
    }, label, count !== null && count !== undefined ? /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-mono-s)",
        color: on ? "var(--court-600)" : "var(--ink-400)",
        fontVariantNumeric: "tabular-nums"
      }
    }, count) : null);
  }));
}
Object.assign(__ds_scope, { Tabs });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/Tabs.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Booking.jsx
try { (() => {
const {
  Card,
  Button,
  Field,
  Input,
  Select,
  RadioGroup,
  Checkbox,
  Switch,
  Badge,
  SpecList,
  Icon,
  Toast,
  Tag,
  ProgressBar
} = window.SportCraftDesignSystem_1803c2;
function Booking() {
  const [step, setStep] = React.useState(1);
  const [service, setService] = React.useState("express");
  const [slot, setSlot] = React.useState("Tue 11:00");
  const [done, setDone] = React.useState(false);
  const price = {
    standard: "£32.00",
    express: "£42.00",
    match: "£52.00"
  }[service];
  const slots = ["Mon 16:00", "Tue 09:30", "Tue 11:00", "Tue 14:30", "Wed 09:00", "Wed 12:00"];
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 32px 96px"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Book a restring"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      letterSpacing: "-0.02em",
      fontWeight: 600,
      margin: "16px 0 32px",
      maxWidth: 620
    }
  }, "Three steps and it's on the bench"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 360px",
      gap: 32,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 0,
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, [[1, "Frame & string"], [2, "Slot"], [3, "Details"]].map(([n, label]) => /*#__PURE__*/React.createElement("button", {
    key: n,
    onClick: () => setStep(n),
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      padding: "16px 12px",
      background: step === n ? "var(--court-050)" : "transparent",
      border: "none",
      borderBottom: step === n ? "2px solid var(--court-600)" : "2px solid transparent",
      cursor: "pointer",
      fontFamily: "var(--font-body)",
      fontSize: 14.5,
      color: step >= n ? "var(--text-primary)" : "var(--text-muted)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 20,
      height: 20,
      borderRadius: "50%",
      background: step > n ? "var(--court-700)" : step === n ? "var(--court-600)" : "var(--ink-100)",
      color: step >= n ? "var(--paper-000)" : "var(--ink-400)",
      fontFamily: "var(--font-mono)",
      fontSize: 10.5
    }
  }, step > n ? "✓" : n), label))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 24
    }
  }, step === 1 ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: "18px 20px"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Sport",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["Tennis", "Badminton", "Squash", "Padel"]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Frame",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "e.g. Wilson Blade 98 v9",
    defaultValue: "Wilson Blade 98 v9"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "String",
    hint: "Or leave it to us"
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["Luxilon ALU Power 125", "Babolat RPM Blast 17", "Solinco Hyper-G 17", "Wilson Natural Gut 16", "Recommend for me"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Main"
  }, /*#__PURE__*/React.createElement(Input, {
    suffix: "kg",
    defaultValue: "24"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Cross"
  }, /*#__PURE__*/React.createElement(Input, {
    suffix: "kg",
    defaultValue: "23"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Service",
    style: {
      gridColumn: "span 2"
    }
  }, /*#__PURE__*/React.createElement(RadioGroup, {
    name: "svc",
    value: service,
    onChange: setService,
    direction: "row",
    options: [{
      value: "standard",
      label: "Standard",
      description: "48 hours · £32"
    }, {
      value: "express",
      label: "Express",
      description: "Same day · £42"
    }, {
      value: "match",
      label: "Match day",
      description: "3 hours · £52"
    }]
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Fit a fresh overgrip (+\xA36)",
    defaultChecked: true,
    style: {
      gridColumn: "span 2"
    }
  })) : step === 2 ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      marginBottom: 14
    }
  }, "Drop-off slot"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 10
    }
  }, slots.map(s => /*#__PURE__*/React.createElement("button", {
    key: s,
    onClick: () => setSlot(s),
    style: {
      padding: "14px 12px",
      borderRadius: "var(--radius-sm)",
      cursor: "pointer",
      background: slot === s ? "var(--court-050)" : "var(--paper-000)",
      border: "1px solid " + (slot === s ? "var(--court-500)" : "var(--border-subtle)"),
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: slot === s ? "var(--court-700)" : "var(--ink-700)"
    }
  }, s))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 24
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    label: "Bench availability this week",
    value: 12,
    max: 18,
    valueLabel: "6 slots left"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10,
      marginTop: 20,
      padding: 14,
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-sm)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 16,
    color: "var(--signal-info)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1.5,
      color: "var(--ink-700)"
    }
  }, "Express and match-day jobs must be dropped off before 14:00."))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: "18px 20px"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Name",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: "Marta Ellis"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Mobile",
    required: true,
    hint: "For the ready-to-collect text"
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: "07700 900412"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Club"
  }, /*#__PURE__*/React.createElement(Input, {
    defaultValue: "Fernhill LTC"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Notes"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Anything the stringer should know"
  })), /*#__PURE__*/React.createElement(Switch, {
    label: "Save this setup as my standing spec",
    defaultChecked: true,
    style: {
      gridColumn: "span 2"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "space-between",
      gap: 12,
      padding: 20,
      borderTop: "1px solid var(--border-hairline)",
      background: "var(--paper-050)"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    disabled: step === 1,
    onClick: () => setStep(step - 1),
    iconLeft: "arrow-left"
  }, "Back"), step < 3 ? /*#__PURE__*/React.createElement(Button, {
    onClick: () => setStep(step + 1),
    iconRight: "arrow-right"
  }, "Continue") : /*#__PURE__*/React.createElement(Button, {
    iconLeft: "check",
    onClick: () => setDone(true)
  }, "Confirm booking"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      marginBottom: 16
    }
  }, "Your booking"), /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "Frame",
      value: "Blade 98 v9"
    }, {
      label: "String",
      value: "ALU Power 125"
    }, {
      label: "Tension",
      value: "24 / 23 kg"
    }, {
      label: "Service",
      value: service.charAt(0).toUpperCase() + service.slice(1)
    }, {
      label: "Drop-off",
      value: slot
    }, {
      label: "Total",
      value: price
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: "20px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 18,
    color: "var(--court-600)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      lineHeight: 1.5,
      color: "var(--ink-700)"
    }
  }, "Not happy with the tension? Bring it back within seven days and we restring it free."))), done ? /*#__PURE__*/React.createElement(Toast, {
    tone: "success",
    title: "Booking confirmed",
    message: "Drop off " + slot + ". We'll text when it's ready.",
    onDismiss: () => setDone(false)
  }) : null)));
}
Object.assign(window, {
  Booking
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Booking.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Home.jsx
try { (() => {
const {
  Button,
  Badge,
  Card,
  StatBlock,
  SpecList,
  Tag,
  Icon
} = window.SportCraftDesignSystem_1803c2;
function SectionLabel({
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--court-600)"
    }
  }, children);
}
function Home({
  onRoute
}) {
  const services = [{
    icon: "circle-dot",
    name: "Tennis",
    copy: "Constant-pull stringing on a Wise 2086 head. Poly, multi, gut and hybrids.",
    price: "from £32"
  }, {
    icon: "feather",
    name: "Badminton",
    copy: "Low-tension specialists — BG80, Aerobite and stiff-frame setups.",
    price: "from £22"
  }, {
    icon: "target",
    name: "Squash",
    copy: "League accounts, bulk turnarounds and next-morning collection.",
    price: "from £26"
  }, {
    icon: "grip-horizontal",
    name: "Padel",
    copy: "Grip builds, balance work and bumper replacement.",
    price: "from £28"
  }];
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "80px 32px 0"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.1fr) minmax(0,1fr)",
      gap: 64,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Racket workshop \xB7 Leeds"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 56,
      lineHeight: 1.02,
      letterSpacing: "-0.022em",
      fontWeight: 600,
      margin: "20px 0 20px"
    }
  }, "Strung right,", /*#__PURE__*/React.createElement("br", null), "every time."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      maxWidth: 460
    }
  }, "Drop a frame in before 14:00 and collect it the same day. We log the string, tension, pattern and stringer for every job, so your next restring matches the last one to the kilo."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 12,
      marginTop: 32
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    onClick: () => onRoute("booking")
  }, "Book a restring"), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "secondary",
    iconRight: "arrow-right",
    onClick: () => onRoute("services")
  }, "See services & prices")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 40,
      marginTop: 44,
      paddingTop: 28,
      borderTop: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Rackets strung",
    value: "11,400"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    label: "Same-day jobs",
    value: "82",
    unit: "%"
  }), /*#__PURE__*/React.createElement(StatBlock, {
    label: "Club accounts",
    value: "14"
  }))), /*#__PURE__*/React.createElement(ImagePlaceholder, {
    label: "Hero \xB7 bench portrait",
    height: 440
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "96px 32px 0"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "What we do"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      letterSpacing: "-0.02em",
      fontWeight: 600,
      margin: "16px 0 32px",
      maxWidth: 620
    }
  }, "Four sports, one bench, no guesswork"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16
    }
  }, services.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.name,
    interactive: true,
    padding: "24px",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      minHeight: 210
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: s.icon,
    size: 22,
    color: "var(--court-600)"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.008em"
    }
  }, s.name), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      flex: 1
    }
  }, s.copy), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--court-700)"
    }
  }, s.price))))), /*#__PURE__*/React.createElement("section", {
    style: {
      marginTop: 96,
      background: "var(--court-900)",
      color: "var(--paper-050)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "80px 32px",
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1.05fr)",
      gap: 64,
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--optic-400)"
    }
  }, "How it works"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      letterSpacing: "-0.02em",
      fontWeight: 600,
      margin: "16px 0 24px",
      color: "var(--paper-000)"
    }
  }, "Four steps, one record"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, [["01", "Drop off or book online", "Tell us the string and tension, or ask us to repeat your last job."], ["02", "On the bench", "Frame inspected, grommets checked, tension calibrated before the first pull."], ["03", "Logged", "String, tension, pattern, machine and stringer written to your record."], ["04", "Collect", "Text when ready. Same-day for anything in before 14:00."]].map(([n, t, c], i) => /*#__PURE__*/React.createElement("div", {
    key: n,
    style: {
      display: "grid",
      gridTemplateColumns: "44px 1fr",
      gap: 16,
      padding: "18px 0",
      borderTop: i ? "1px solid rgba(255,255,255,0.12)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--optic-400)"
    }
  }, n), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 500,
      color: "var(--paper-000)"
    }
  }, t), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--court-200)",
      marginTop: 4
    }
  }, c)))))), /*#__PURE__*/React.createElement(ImagePlaceholder, {
    label: "Workshop \xB7 full bleed",
    height: 420,
    tone: "dark",
    style: {
      border: "1px solid rgba(255,255,255,0.12)"
    }
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "96px 32px 0",
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 380px",
      gap: 48,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SectionLabel, null, "Your record"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      letterSpacing: "-0.02em",
      fontWeight: 600,
      margin: "16px 0 20px",
      maxWidth: 520
    }
  }, "We keep the numbers so you don't have to"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      maxWidth: 520
    }
  }, "Every job produces a spec card. Ask for \"the same again\" and it will be the same again \u2014 down to the cross tension and the knot."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 28
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    color: "var(--string-poly)"
  }, "Polyester"), /*#__PURE__*/React.createElement(Tag, {
    color: "var(--string-multi)"
  }, "Multifilament"), /*#__PURE__*/React.createElement(Tag, {
    color: "var(--string-gut)"
  }, "Natural gut"), /*#__PURE__*/React.createElement(Tag, {
    color: "var(--string-hybrid)"
  }, "Hybrid"))), /*#__PURE__*/React.createElement(Card, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    dot: true
  }, "Last job"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--ink-400)"
    }
  }, "SC-1042")), /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "Frame",
      value: "Blade 98 v9"
    }, {
      label: "String",
      value: "ALU Power 125"
    }, {
      label: "Tension",
      value: "24 / 23 kg"
    }, {
      label: "Pattern",
      value: "16 × 19"
    }, {
      label: "Stringer",
      value: "Ravi H."
    }]
  }), /*#__PURE__*/React.createElement(Button, {
    fullWidth: true,
    variant: "secondary",
    size: "sm",
    style: {
      marginTop: 20
    },
    iconLeft: "rotate-ccw"
  }, "Repeat this job"))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "96px auto 0",
      padding: "0 32px 96px"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "brand",
    padding: "48px",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      letterSpacing: "-0.016em",
      fontWeight: 600
    }
  }, "In before 14:00, out the same day"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 16,
      lineHeight: 1.55,
      color: "var(--ink-600)",
      marginTop: 10,
      maxWidth: 520
    }
  }, "Match tomorrow? Book an express slot and we will have it on the bench within the hour.")), /*#__PURE__*/React.createElement(Button, {
    size: "lg",
    variant: "accent",
    iconRight: "arrow-right",
    onClick: () => onRoute("booking")
  }, "Book a restring"))));
}
Object.assign(window, {
  Home,
  SectionLabel
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Home.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/Services.jsx
try { (() => {
const {
  Card,
  Button,
  Badge,
  Tabs,
  SpecList,
  Tag,
  Icon,
  StatBlock
} = window.SportCraftDesignSystem_1803c2;
const TIERS = [{
  name: "Standard",
  price: "£32",
  turn: "48 hours",
  features: ["Frame and grommet check", "Tension logged to your record", "Text when ready"],
  tone: "default"
}, {
  name: "Express",
  price: "£42",
  turn: "Same day",
  features: ["In before 14:00, out by 18:00", "Priority on the bench", "Everything in Standard"],
  tone: "brand",
  featured: true
}, {
  name: "Match day",
  price: "£52",
  turn: "3 hours",
  features: ["Straight onto the bench", "Two frames matched to each other", "Everything in Express"],
  tone: "default"
}];
function Services({
  onRoute
}) {
  const [sport, setSport] = React.useState("tennis");
  const specs = {
    tennis: [{
      label: "Tension range",
      value: "18 – 30 kg"
    }, {
      label: "Patterns",
      value: "16×19, 18×20, 16×20"
    }, {
      label: "Machine",
      value: "Wise 2086 constant pull"
    }, {
      label: "Typical turnaround",
      value: "24 – 48 hours"
    }],
    badminton: [{
      label: "Tension range",
      value: "9 – 15 kg"
    }, {
      label: "Patterns",
      value: "22×21, 22×23"
    }, {
      label: "Machine",
      value: "Victor C-3000 · 4-point"
    }, {
      label: "Typical turnaround",
      value: "24 hours"
    }],
    squash: [{
      label: "Tension range",
      value: "11 – 15 kg"
    }, {
      label: "Patterns",
      value: "14×18, 16×17"
    }, {
      label: "Machine",
      value: "Wise 2086 constant pull"
    }, {
      label: "Typical turnaround",
      value: "Next morning"
    }],
    padel: [{
      label: "Tension range",
      value: "n/a · solid frame"
    }, {
      label: "Services",
      value: "Grip build, bumper, balance"
    }, {
      label: "Bench",
      value: "Fitting station"
    }, {
      label: "Typical turnaround",
      value: "Same day"
    }]
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 32px 0"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "Services & pricing"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      letterSpacing: "-0.02em",
      fontWeight: 600,
      margin: "16px 0 16px",
      maxWidth: 680
    }
  }, "One price list. No surprises at the counter."), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      maxWidth: 560
    }
  }, "Prices include string, labour and a fresh overgrip. Bring your own string and we take \xA38 off.")), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "48px 32px 0",
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16
    }
  }, TIERS.map(t => /*#__PURE__*/React.createElement(Card, {
    key: t.name,
    tone: t.tone,
    padding: "28px",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      borderColor: t.featured ? "var(--court-300)" : undefined
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.008em"
    }
  }, t.name), t.featured ? /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "Most booked") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      fontWeight: 600,
      letterSpacing: "-0.02em",
      fontVariantNumeric: "tabular-nums"
    }
  }, t.price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--ink-500)"
    }
  }, "per frame \xB7 ", t.turn)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      flex: 1
    }
  }, t.features.map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      display: "flex",
      gap: 9,
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      marginTop: 2
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 15,
    color: "var(--court-600)"
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.5,
      color: "var(--ink-700)"
    }
  }, f)))), /*#__PURE__*/React.createElement(Button, {
    variant: t.featured ? "primary" : "secondary",
    fullWidth: true,
    onClick: () => onRoute("booking")
  }, "Book ", t.name.toLowerCase())))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "96px 32px 0"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "By sport"), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      letterSpacing: "-0.016em",
      fontWeight: 600,
      margin: "14px 0 24px"
    }
  }, "What the bench can do"), /*#__PURE__*/React.createElement(Tabs, {
    value: sport,
    onChange: setSport,
    items: [{
      value: "tennis",
      label: "Tennis"
    }, {
      value: "badminton",
      label: "Badminton"
    }, {
      value: "squash",
      label: "Squash"
    }, {
      value: "padel",
      label: "Padel"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: 40,
      marginTop: 28,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement(SpecList, {
    items: specs[sport]
  })), /*#__PURE__*/React.createElement(ImagePlaceholder, {
    label: sport + " · detail shot",
    height: 260
  }))), /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "96px auto 0",
      padding: "0 32px 96px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16
    }
  }, [["Grips & overgrips", "Replacement grips, build-ups and heat-shrink sleeves fitted while you wait.", "from £6"], ["Racket matching", "Two or three frames matched on weight, balance and swingweight.", "from £45"], ["Club accounts", "Monthly invoicing, collection runs and league turnaround windows.", "on request"]].map(([t, c, p]) => /*#__PURE__*/React.createElement(Card, {
    key: t,
    padding: "24px",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 16,
      fontWeight: 600
    }
  }, t), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      flex: 1
    }
  }, c), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--court-700)"
    }
  }, p))))));
}
Object.assign(window, {
  Services
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/Services.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/SiteChrome.jsx
try { (() => {
const {
  Button,
  Icon,
  IconButton,
  Badge
} = window.SportCraftDesignSystem_1803c2;
function Wordmark({
  inverse,
  size = 20
}) {
  return /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: size,
      letterSpacing: "-0.028em",
      color: inverse ? "var(--paper-000)" : "var(--court-800)"
    }
  }, "SportCraft");
}

/* No logo files were supplied, so the brand name is set in type. */
function ImagePlaceholder({
  label,
  height = 320,
  tone = "sunken",
  style
}) {
  const bg = tone === "dark" ? "var(--court-900)" : tone === "clay" ? "var(--clay-100)" : "var(--paper-200)";
  const fg = tone === "dark" ? "var(--court-300)" : "var(--ink-400)";
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height,
      background: bg,
      borderRadius: "var(--radius-lg)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      ...style
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: fg
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "image",
    size: 14,
    color: fg
  }), label));
}
function SiteHeader({
  route,
  onRoute
}) {
  const links = [["services", "Services"], ["booking", "Book a restring"], ["workshop", "The workshop"]];
  return /*#__PURE__*/React.createElement("header", {
    style: {
      position: "sticky",
      top: 0,
      zIndex: 20,
      background: "rgba(250,249,246,0.88)",
      backdropFilter: "blur(10px)",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "0 32px",
      height: 68,
      display: "flex",
      alignItems: "center",
      gap: 32
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => onRoute("home"),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: 0,
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(Wordmark, null)), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      gap: 4
    }
  }, links.map(([k, label]) => /*#__PURE__*/React.createElement("button", {
    key: k,
    onClick: () => onRoute(k),
    style: {
      background: "none",
      border: "none",
      cursor: "pointer",
      padding: "8px 12px",
      borderRadius: "var(--radius-sm)",
      fontFamily: "var(--font-body)",
      fontSize: 15,
      color: route === k ? "var(--court-700)" : "var(--ink-700)",
      fontWeight: route === k ? 500 : 400
    }
  }, label))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      fontFamily: "var(--font-mono)",
      fontSize: 11.5,
      color: "var(--ink-500)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "map-pin",
    size: 14,
    color: "var(--ink-400)"
  }), "Fernhill Road, Leeds"), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "Check job status"), /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    onClick: () => onRoute("booking")
  }, "Book a restring")));
}
function SiteFooter({
  onRoute
}) {
  const cols = [["Services", ["Tennis restringing", "Badminton restringing", "Squash & padel", "Grips & customisation", "Racket matching"]], ["Workshop", ["Our bench", "Stringers", "Machines & calibration", "Club accounts"]], ["Practical", ["Opening hours", "Turnaround times", "Pricing", "Find us"]]];
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      background: "var(--court-900)",
      color: "var(--court-200)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "64px 32px 40px",
      display: "grid",
      gridTemplateColumns: "1.4fr repeat(3,1fr)",
      gap: 40
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Wordmark, {
    inverse: true,
    size: 22
  }), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 14,
      fontSize: 14.5,
      lineHeight: 1.6,
      color: "var(--court-200)",
      maxWidth: 260
    }
  }, "A specialist racket workshop. Every frame logged, every tension recorded, every job collected when we said it would be."), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 20
    }
  }, ["instagram", "phone", "mail"].map(i => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: "var(--radius-sm)",
      border: "1px solid rgba(255,255,255,0.14)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: i,
    size: 16,
    color: "var(--court-200)"
  }))))), cols.map(([title, items]) => /*#__PURE__*/React.createElement("div", {
    key: title
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--optic-400)"
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      marginTop: 16
    }
  }, items.map(it => /*#__PURE__*/React.createElement("span", {
    key: it,
    style: {
      fontSize: 14.5,
      color: "var(--court-200)",
      cursor: "pointer"
    }
  }, it)))))), /*#__PURE__*/React.createElement("div", {
    style: {
      borderTop: "1px solid rgba(255,255,255,0.1)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "20px 32px",
      display: "flex",
      gap: 20,
      fontFamily: "var(--font-mono)",
      fontSize: 11.5,
      color: "var(--court-300)"
    }
  }, /*#__PURE__*/React.createElement("span", null, "\xA9 2026 SportCraft Racket Workshop"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("span", null, "Mon\u2013Sat 09:00\u201318:00"), /*#__PURE__*/React.createElement("span", null, "Same-day cut-off 14:00"))));
}
Object.assign(window, {
  SiteHeader,
  SiteFooter,
  Wordmark,
  ImagePlaceholder
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/SiteChrome.jsx", error: String((e && e.message) || e) }); }

// ui_kits/website/site.jsx
try { (() => {
const {
  Card,
  Button,
  StatBlock,
  SpecList,
  Badge,
  Icon
} = window.SportCraftDesignSystem_1803c2;
function Workshop() {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      maxWidth: 1200,
      margin: "0 auto",
      padding: "72px 32px 96px"
    }
  }, /*#__PURE__*/React.createElement(SectionLabel, null, "The workshop"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 40,
      letterSpacing: "-0.02em",
      fontWeight: 600,
      margin: "16px 0 16px",
      maxWidth: 660
    }
  }, "A bench, two machines and a calibration log"), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 17,
      lineHeight: 1.55,
      color: "var(--text-secondary)",
      maxWidth: 560
    }
  }, "We are a workshop first and a shop second. Everything on the rack is there because it gets used on the bench."), /*#__PURE__*/React.createElement(ImagePlaceholder, {
    label: "Workshop \xB7 wide",
    height: 360,
    style: {
      marginTop: 40
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16,
      marginTop: 40
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "Machines",
      value: "2"
    }, {
      label: "Calibration",
      value: "Weekly"
    }, {
      label: "Stringers",
      value: "3 · USRSA"
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "Strings stocked",
      value: "26"
    }, {
      label: "Gauges",
      value: "0.66 – 1.35 mm"
    }, {
      label: "Reels on rack",
      value: "12"
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "24px"
  }, /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "Open",
      value: "Mon–Sat"
    }, {
      label: "Hours",
      value: "09:00 – 18:00"
    }, {
      label: "Same-day cut-off",
      value: "14:00"
    }]
  }))));
}
function Site() {
  const [route, setRoute] = React.useState("home");
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [route]);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(SiteHeader, {
    route: route,
    onRoute: setRoute
  }), route === "home" ? /*#__PURE__*/React.createElement(Home, {
    onRoute: setRoute
  }) : route === "services" ? /*#__PURE__*/React.createElement(Services, {
    onRoute: setRoute
  }) : route === "booking" ? /*#__PURE__*/React.createElement(Booking, null) : /*#__PURE__*/React.createElement(Workshop, null), /*#__PURE__*/React.createElement(SiteFooter, {
    onRoute: setRoute
  }));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(Site, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/website/site.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workshop-app/AppShell.jsx
try { (() => {
const {
  SideNav,
  Icon,
  IconButton,
  Input,
  Badge,
  Button
} = window.SportCraftDesignSystem_1803c2;
function Logotype({
  inverse
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 18,
      letterSpacing: "-0.028em",
      color: inverse ? "var(--paper-000)" : "var(--court-800)"
    }
  }, "SportCraft"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 3,
      padding: "2px 5px"
    }
  }, "Workshop"));
}
function TopBar({
  title,
  crumb,
  actions,
  onSearch
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 20,
      height: 60,
      padding: "0 24px",
      borderBottom: "1px solid var(--border-hairline)",
      background: "var(--paper-000)",
      flex: "0 0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2,
      minWidth: 0
    }
  }, crumb ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)"
    }
  }, crumb) : null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      letterSpacing: "-0.008em",
      fontWeight: 600,
      margin: 0,
      whiteSpace: "nowrap"
    }
  }, title)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Input, {
    iconLeft: "search",
    size: "sm",
    placeholder: "Search jobs, customers, frames",
    style: {
      width: 268
    },
    onChange: e => onSearch && onSearch(e.target.value)
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "bell",
    label: "Notifications",
    variant: "outline",
    size: "sm"
  }), actions, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      paddingLeft: 6,
      borderLeft: "1px solid var(--border-hairline)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 30,
      height: 30,
      borderRadius: "50%",
      background: "var(--court-700)",
      color: "var(--paper-000)",
      fontFamily: "var(--font-mono)",
      fontSize: 11
    }
  }, "RH"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: "var(--ink-700)"
    }
  }, "Ravi H.")));
}
function AppShell({
  route,
  onRoute,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      height: "100%",
      minWidth: 1240,
      minHeight: 0,
      background: "var(--surface-page)"
    }
  }, /*#__PURE__*/React.createElement("aside", {
    style: {
      width: 248,
      flex: "0 0 auto",
      display: "flex",
      flexDirection: "column",
      gap: 4,
      padding: "18px 12px",
      borderRight: "1px solid var(--border-hairline)",
      background: "var(--paper-000)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 8px 10px"
    }
  }, /*#__PURE__*/React.createElement(Logotype, null)), /*#__PURE__*/React.createElement(SideNav, {
    value: route,
    onChange: onRoute,
    style: {
      flex: 1
    },
    items: [{
      section: "Workshop"
    }, {
      value: "queue",
      label: "Job queue",
      icon: "list-checks",
      count: 12
    }, {
      value: "bench",
      label: "At the bench",
      icon: "wrench",
      count: 3
    }, {
      value: "ready",
      label: "Ready for pickup",
      icon: "package-check",
      count: 7
    }, {
      section: "Shop"
    }, {
      value: "customers",
      label: "Customers",
      icon: "users"
    }, {
      value: "stock",
      label: "String stock",
      icon: "boxes"
    }, {
      value: "settings",
      label: "Settings",
      icon: "sliders-horizontal"
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 14,
      background: "var(--court-050)",
      border: "1px solid var(--court-100)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "calendar-clock",
    size: 14,
    color: "var(--court-600)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--court-700)"
    }
  }, "Today")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--ink-700)",
      marginTop: 8,
      lineHeight: 1.45
    }
  }, "12 of 18 bench slots booked. Cut-off for same-day is 14:00."))), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column"
    }
  }, children));
}
Object.assign(window, {
  AppShell,
  TopBar,
  Logotype
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workshop-app/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workshop-app/Customers.jsx
try { (() => {
const {
  Card,
  Badge,
  Button,
  IconButton,
  Input,
  SpecList,
  Tag,
  Tabs
} = window.SportCraftDesignSystem_1803c2;
const CUSTOMERS = [{
  name: "Marta Ellis",
  initials: "ME",
  club: "Fernhill LTC",
  sport: "Tennis",
  jobs: 18,
  last: "12 Aug 2026",
  pref: "ALU Power 125 · 24 / 23 kg",
  state: "active"
}, {
  name: "Tom Iredale",
  initials: "TI",
  club: "Riverside Padel",
  sport: "Padel",
  jobs: 6,
  last: "02 Sep 2026",
  pref: "RPM Blast 17 · 25 kg",
  state: "active"
}, {
  name: "Jo Kerrigan",
  initials: "JK",
  club: "Fernhill LTC",
  sport: "Tennis",
  jobs: 23,
  last: "18 Sep 2026",
  pref: "Velocity / 4G hybrid · 23 / 22 kg",
  state: "active"
}, {
  name: "Bea Lawson",
  initials: "BL",
  club: "Northgate Badminton",
  sport: "Badminton",
  jobs: 11,
  last: "21 Sep 2026",
  pref: "BG80 Power · 12.5 kg",
  state: "active"
}, {
  name: "Squash league",
  initials: "SL",
  club: "Cavendish Squash",
  sport: "Squash",
  jobs: 64,
  last: "19 Sep 2026",
  pref: "X-One Biphase · 13 kg",
  state: "account"
}, {
  name: "Danny Obi",
  initials: "DO",
  club: "—",
  sport: "Tennis",
  jobs: 3,
  last: "04 Mar 2026",
  pref: "Natural gut 16 / 4G · 26 / 24 kg",
  state: "lapsed"
}];
function Customers() {
  const [selected, setSelected] = React.useState(CUSTOMERS[0]);
  const [q, setQ] = React.useState("");
  const rows = CUSTOMERS.filter(c => (c.name + c.club).toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 340px",
      gap: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      overflow: "auto",
      padding: "24px 24px 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Input, {
    iconLeft: "search",
    placeholder: "Search customers or clubs",
    value: q,
    onChange: e => setQ(e.target.value),
    style: {
      maxWidth: 300
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: "upload",
    size: "sm"
  }, "Import"), /*#__PURE__*/React.createElement(Button, {
    iconLeft: "user-plus",
    size: "sm"
  }, "Add customer")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-1)",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 760
    }
  }, rows.map((c, i) => {
    const on = selected.name === c.name;
    return /*#__PURE__*/React.createElement("div", {
      key: c.name,
      onClick: () => setSelected(c),
      style: {
        display: "grid",
        gridTemplateColumns: "34px minmax(0,1.4fr) minmax(0,1fr) 100px 110px 92px",
        alignItems: "center",
        gap: 16,
        padding: "13px 18px",
        cursor: "pointer",
        borderTop: i ? "1px solid var(--border-hairline)" : "none",
        background: on ? "var(--court-050)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        borderRadius: "50%",
        background: on ? "var(--court-100)" : "var(--ink-050)",
        color: on ? "var(--court-700)" : "var(--ink-600)",
        fontFamily: "var(--font-mono)",
        fontSize: 11
      }
    }, c.initials), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 15,
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, c.name), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--text-muted)"
      }
    }, c.club)), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13.5,
        color: "var(--ink-700)"
      }
    }, c.sport), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        color: "var(--ink-900)",
        fontVariantNumeric: "tabular-nums"
      }
    }, c.jobs, " jobs"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 12.5,
        color: "var(--ink-500)"
      }
    }, c.last), /*#__PURE__*/React.createElement(Badge, {
      tone: c.state === "active" ? "success" : c.state === "account" ? "info" : "neutral"
    }, c.state));
  })))), /*#__PURE__*/React.createElement("aside", {
    style: {
      borderLeft: "1px solid var(--border-hairline)",
      background: "var(--paper-000)",
      padding: "24px 22px",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 44,
      height: 44,
      borderRadius: "50%",
      background: "var(--court-700)",
      color: "var(--paper-000)",
      fontFamily: "var(--font-mono)",
      fontSize: 14
    }
  }, selected.initials), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.008em"
    }
  }, selected.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13.5,
      color: "var(--text-muted)"
    }
  }, selected.club))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      margin: "18px 0 20px"
    }
  }, /*#__PURE__*/React.createElement(Button, {
    size: "sm",
    iconLeft: "plus",
    style: {
      flex: 1
    }
  }, "New job"), /*#__PURE__*/React.createElement(IconButton, {
    icon: "phone",
    label: "Call",
    variant: "outline",
    size: "sm"
  }), /*#__PURE__*/React.createElement(IconButton, {
    icon: "mail",
    label: "Email",
    variant: "outline",
    size: "sm"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      marginBottom: 10
    }
  }, "Standing spec"), /*#__PURE__*/React.createElement(SpecList, {
    dense: true,
    items: [{
      label: "Sport",
      value: selected.sport
    }, {
      label: "Setup",
      value: selected.pref
    }, {
      label: "Jobs",
      value: selected.jobs
    }, {
      label: "Last visit",
      value: selected.last
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      margin: "24px 0 10px"
    }
  }, "Frames on file"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, ["Blade 98 v9 · 2024", "Blade 98 v8 · 2022 (spare)"].map(f => /*#__PURE__*/React.createElement("div", {
    key: f,
    style: {
      padding: "11px 13px",
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-sm)",
      fontSize: 14
    }
  }, f))), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      margin: "24px 0 10px"
    }
  }, "Tags"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    color: "var(--string-poly)"
  }, "Polyester"), /*#__PURE__*/React.createElement(Tag, {
    color: "var(--optic-600)"
  }, "Express"), /*#__PURE__*/React.createElement(Tag, {
    color: "var(--ink-300)"
  }, "Club member"))));
}
Object.assign(window, {
  Customers,
  CUSTOMERS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workshop-app/Customers.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workshop-app/JobDetail.jsx
try { (() => {
const {
  Breadcrumbs,
  Badge,
  Button,
  IconButton,
  Card,
  SpecList,
  Tabs,
  Tag,
  ProgressBar,
  Icon,
  Field,
  Input,
  Select,
  Checkbox
} = window.SportCraftDesignSystem_1803c2;
function Timeline({
  steps
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, steps.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.label,
    style: {
      display: "grid",
      gridTemplateColumns: "22px 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: s.done ? "var(--court-700)" : "var(--paper-000)",
      border: s.done ? "none" : "1px solid var(--ink-200)"
    }
  }, s.done ? /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 11,
    strokeWidth: 2.5,
    color: "var(--paper-000)"
  }) : null), i < steps.length - 1 ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      width: 1,
      background: "var(--border-hairline)",
      minHeight: 26
    }
  }) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      paddingBottom: i < steps.length - 1 ? 18 : 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: s.done ? 500 : 400,
      color: s.done ? "var(--text-primary)" : "var(--text-muted)"
    }
  }, s.label), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 11.5,
      color: "var(--ink-400)",
      marginTop: 2
    }
  }, s.time)))));
}
function JobDetail({
  job,
  onBack,
  onComplete
}) {
  const [tab, setTab] = React.useState("spec");
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: "auto",
      padding: "20px 24px 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "arrow-left",
    label: "Back to queue",
    variant: "outline",
    size: "sm",
    onClick: onBack
  }), /*#__PURE__*/React.createElement(Breadcrumbs, {
    items: ["Workshop", "Job queue", job.id]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: "printer",
    size: "sm"
  }, "Print ticket"), /*#__PURE__*/React.createElement(Button, {
    iconLeft: "check",
    size: "sm",
    onClick: onComplete
  }, "Mark ready")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 316px",
      gap: 24,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "22px 24px 18px",
      display: "flex",
      alignItems: "flex-start",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--ink-400)"
    }
  }, job.id), /*#__PURE__*/React.createElement(Badge, {
    tone: "brand",
    dot: true
  }, "At the bench"), job.express ? /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "Express") : null), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 30,
      letterSpacing: "-0.016em",
      fontWeight: 600,
      margin: "10px 0 6px"
    }
  }, job.frame), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      color: "var(--text-secondary)"
    }
  }, job.customer, " \xB7 due ", job.due)), /*#__PURE__*/React.createElement("div", {
    style: {
      textAlign: "right"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)"
    }
  }, "Price"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 24,
      fontWeight: 600,
      marginTop: 6,
      fontVariantNumeric: "tabular-nums"
    }
  }, "\xA332.00"))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "0 24px"
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    items: [{
      value: "spec",
      label: "Specification"
    }, {
      value: "history",
      label: "Frame history",
      count: 6
    }, {
      value: "notes",
      label: "Notes"
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "20px 24px 24px"
    }
  }, tab === "spec" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "0 32px"
    }
  }, /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "String",
      value: job.string
    }, {
      label: "Tension",
      value: job.tension
    }, {
      label: "Pattern",
      value: "16 × 19"
    }, {
      label: "Machine",
      value: "Wise 2086 · bench 2"
    }]
  }), /*#__PURE__*/React.createElement(SpecList, {
    items: [{
      label: "Stringer",
      value: "Ravi H."
    }, {
      label: "Grommets",
      value: "Checked · 2 replaced"
    }, {
      label: "Grip",
      value: "Overgrip renewed"
    }, {
      label: "Logged",
      value: "Mon 09:42"
    }]
  })) : tab === "history" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column"
    }
  }, [["12 Aug 2026", "ALU Power 125", "24 / 23 kg", "Ravi H."], ["02 Jun 2026", "ALU Power 125", "24 / 23 kg", "Ravi H."], ["14 Apr 2026", "ALU Power 125", "25 / 24 kg", "Sam T."], ["20 Feb 2026", "RPM Blast 17", "25 kg", "Ravi H."]].map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r[0],
    style: {
      display: "grid",
      gridTemplateColumns: "120px 1fr 100px 90px",
      gap: 16,
      padding: "11px 0",
      borderTop: i ? "1px solid var(--border-hairline)" : "none",
      fontSize: 14
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--ink-500)"
    }
  }, r[0]), /*#__PURE__*/React.createElement("span", null, r[1]), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      fontVariantNumeric: "tabular-nums"
    }
  }, r[2]), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--text-muted)"
    }
  }, r[3])))) : /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-sunken)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-sm)",
      padding: 16,
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--ink-700)"
    }
  }, "Prefers a slightly lower cross. Flagged a hairline crack at 3 o'clock on the last visit \u2014 worth a look before stringing."), /*#__PURE__*/React.createElement(Field, {
    label: "Add a note"
  }, /*#__PURE__*/React.createElement(Input, {
    placeholder: "Visible to the workshop only"
  }))))), /*#__PURE__*/React.createElement(Card, {
    padding: "20px 24px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clipboard-check",
    size: 16,
    color: "var(--court-600)"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 16,
      fontWeight: 600
    }
  }, "Bench checklist")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Checkbox, {
    label: "Grommets inspected",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Tension calibrated",
    defaultChecked: true
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Knots trimmed"
  }), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Stencil applied"
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "sunken",
    padding: "20px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      marginBottom: 16
    }
  }, "Progress"), /*#__PURE__*/React.createElement(Timeline, {
    steps: [{
      label: "Dropped off",
      time: "Mon 09:42",
      done: true
    }, {
      label: "Queued",
      time: "Mon 09:44",
      done: true
    }, {
      label: "At the bench",
      time: "Tue 11:10",
      done: true
    }, {
      label: "Ready for pickup",
      time: "Due today 16:00",
      done: false
    }, {
      label: "Collected",
      time: "—",
      done: false
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "20px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      marginBottom: 14
    }
  }, "Customer"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "var(--court-050)",
      color: "var(--court-700)",
      fontFamily: "var(--font-mono)",
      fontSize: 12
    }
  }, "ME"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, job.customer), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)"
    }
  }, "Member since 2021 \xB7 18 jobs"))), /*#__PURE__*/React.createElement(SpecList, {
    dense: true,
    items: [{
      label: "Phone",
      value: "07700 900412"
    }, {
      label: "Preference",
      value: "Text when ready"
    }, {
      label: "Club",
      value: "Fernhill LTC"
    }]
  })), /*#__PURE__*/React.createElement(Card, {
    padding: "20px"
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    label: "Reel remaining",
    value: 38,
    max: 100,
    valueLabel: "38% \xB7 ALU 125"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8,
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(Tag, {
    color: "var(--string-poly)"
  }, "Polyester"), /*#__PURE__*/React.createElement(Tag, {
    color: "var(--ink-300)"
  }, "1.25 mm"))))));
}
Object.assign(window, {
  JobDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workshop-app/JobDetail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workshop-app/JobQueue.jsx
try { (() => {
const {
  Tabs,
  Badge,
  Button,
  IconButton,
  Card,
  StatBlock,
  ProgressBar,
  Tag,
  Tooltip
} = window.SportCraftDesignSystem_1803c2;
const JOBS = [{
  id: "SC-1042",
  frame: "Wilson Blade 98 v9",
  customer: "Marta Ellis",
  string: "Luxilon ALU Power 125",
  family: "poly",
  tension: "24 / 23 kg",
  due: "Today 16:00",
  state: "bench",
  express: true
}, {
  id: "SC-1041",
  frame: "Babolat Pure Aero 98",
  customer: "Tom Iredale",
  string: "RPM Blast 17",
  family: "poly",
  tension: "25 kg",
  due: "Today 18:00",
  state: "bench",
  express: false
}, {
  id: "SC-1040",
  frame: "Head Speed MP",
  customer: "Jo Kerrigan",
  string: "Velocity MLT / 4G hybrid",
  family: "hybrid",
  tension: "23 / 22 kg",
  due: "Tomorrow 10:00",
  state: "queue",
  express: false
}, {
  id: "SC-1039",
  frame: "Yonex Astrox 99 Pro",
  customer: "Bea Lawson",
  string: "BG80 Power",
  family: "multi",
  tension: "12.5 kg",
  due: "Tomorrow 12:00",
  state: "queue",
  express: false
}, {
  id: "SC-1038",
  frame: "Tecnifibre Carboflex 125",
  customer: "Squash league",
  string: "X-One Biphase",
  family: "multi",
  tension: "13 kg",
  due: "Wed 09:00",
  state: "queue",
  express: false
}, {
  id: "SC-1036",
  frame: "Wilson Pro Staff 97",
  customer: "Danny Obi",
  string: "Natural gut 16 / 4G",
  family: "gut",
  tension: "26 / 24 kg",
  due: "Collected",
  state: "ready",
  express: false
}, {
  id: "SC-1035",
  frame: "Head Radical Pro",
  customer: "Alina Petrova",
  string: "Hyper-G 17",
  family: "poly",
  tension: "24 kg",
  due: "Ready Fri",
  state: "ready",
  express: true
}];
const STATE_META = {
  queue: {
    label: "In queue",
    tone: "neutral"
  },
  bench: {
    label: "At the bench",
    tone: "brand"
  },
  ready: {
    label: "Ready",
    tone: "success"
  }
};
const FAMILY = {
  poly: "var(--string-poly)",
  gut: "var(--string-gut)",
  multi: "var(--string-multi)",
  hybrid: "var(--string-hybrid)"
};
function JobRow({
  job,
  onOpen,
  first
}) {
  const [hover, setHover] = React.useState(false);
  const meta = STATE_META[job.state];
  return /*#__PURE__*/React.createElement("div", {
    onClick: () => onOpen(job),
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: {
      display: "grid",
      gridTemplateColumns: "84px minmax(0,1.5fr) minmax(0,1.5fr) 110px 128px 120px 40px",
      alignItems: "center",
      gap: 16,
      padding: "14px 20px",
      cursor: "pointer",
      borderTop: first ? "none" : "1px solid var(--border-hairline)",
      background: hover ? "var(--paper-050)" : "transparent",
      transition: "background-color var(--duration-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--ink-500)"
    }
  }, job.id), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: "var(--text-primary)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, job.frame), job.express ? /*#__PURE__*/React.createElement(Badge, {
    tone: "accent"
  }, "Express") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: "var(--text-muted)",
      marginTop: 3
    }
  }, job.customer)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: FAMILY[job.family],
      flex: "0 0 auto"
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13.5,
      color: "var(--ink-700)",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, job.string)), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      color: "var(--ink-900)",
      fontVariantNumeric: "tabular-nums"
    }
  }, job.tension), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: job.due.startsWith("Today") ? "var(--clay-600)" : "var(--ink-500)"
    }
  }, job.due), /*#__PURE__*/React.createElement(Badge, {
    tone: meta.tone,
    dot: true
  }, meta.label), /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: hover ? 1 : 0,
      transition: "opacity var(--duration-fast) var(--ease-standard)"
    }
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "chevron-right",
    label: "Open job",
    size: "sm"
  })));
}
function JobQueue({
  onOpen,
  query
}) {
  const [tab, setTab] = React.useState("all");
  const [families, setFamilies] = React.useState([]);
  const toggle = f => setFamilies(s => s.includes(f) ? s.filter(x => x !== f) : [...s, f]);
  const rows = JOBS.filter(j => tab === "all" ? true : j.state === tab).filter(j => families.length ? families.includes(j.family) : true).filter(j => query ? (j.frame + j.customer + j.id).toLowerCase().includes(query.toLowerCase()) : true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: "auto",
      padding: "24px 24px 48px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "In the workshop",
    value: "22",
    unit: "frames",
    icon: "layers"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Due today",
    value: "5",
    delta: "2 express",
    deltaTone: "neutral",
    icon: "clock"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Avg turnaround",
    value: "31",
    unit: "hrs",
    delta: "-4h",
    deltaTone: "up",
    icon: "activity"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(ProgressBar, {
    label: "Bench load today",
    value: 12,
    max: 18,
    valueLabel: "12 / 18"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      gap: 20,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement(Tabs, {
    value: tab,
    onChange: setTab,
    style: {
      flex: 1
    },
    items: [{
      value: "all",
      label: "All",
      count: JOBS.length
    }, {
      value: "queue",
      label: "In queue",
      count: JOBS.filter(j => j.state === "queue").length
    }, {
      value: "bench",
      label: "At the bench",
      count: JOBS.filter(j => j.state === "bench").length
    }, {
      value: "ready",
      label: "Ready",
      count: JOBS.filter(j => j.state === "ready").length
    }]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      marginBottom: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)",
      marginRight: 4
    }
  }, "String"), [["poly", "Polyester"], ["multi", "Multifilament"], ["gut", "Natural gut"], ["hybrid", "Hybrid"]].map(([k, label]) => /*#__PURE__*/React.createElement(Tag, {
    key: k,
    color: FAMILY[k],
    selected: families.includes(k),
    onClick: () => toggle(k)
  }, label)), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Tooltip, {
    label: "Print today's bench sheet"
  }, /*#__PURE__*/React.createElement(IconButton, {
    icon: "printer",
    label: "Print",
    variant: "outline",
    size: "sm"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface-card)",
      border: "1px solid var(--border-hairline)",
      borderRadius: "var(--radius-md)",
      boxShadow: "var(--shadow-1)",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 1040
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "84px minmax(0,1.5fr) minmax(0,1.5fr) 110px 128px 120px 40px",
      gap: 16,
      padding: "10px 20px",
      background: "var(--paper-050)",
      borderBottom: "1px solid var(--border-hairline)"
    }
  }, ["Job", "Frame / customer", "String", "Tension", "Due", "State", ""].map(h => /*#__PURE__*/React.createElement("span", {
    key: h,
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: "var(--ink-400)"
    }
  }, h))), rows.map((j, i) => /*#__PURE__*/React.createElement(JobRow, {
    key: j.id,
    job: j,
    first: i === 0,
    onOpen: onOpen
  })), rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "48px 20px",
      textAlign: "center",
      color: "var(--text-muted)",
      fontSize: 15
    }
  }, "No jobs match those filters.") : null)));
}
Object.assign(window, {
  JobQueue,
  JOBS,
  FAMILY,
  STATE_META
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workshop-app/JobQueue.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workshop-app/StringStock.jsx
try { (() => {
const {
  Card,
  Badge,
  Button,
  IconButton,
  ProgressBar,
  StatBlock,
  Tag,
  Toast,
  Tabs
} = window.SportCraftDesignSystem_1803c2;
const STOCK = [{
  name: "Luxilon ALU Power 125",
  family: "poly",
  gauge: "1.25 mm",
  reels: 3,
  pct: 38,
  cost: "£11.50",
  state: "ok"
}, {
  name: "Babolat RPM Blast 17",
  family: "poly",
  gauge: "1.25 mm",
  reels: 1,
  pct: 12,
  cost: "£9.80",
  state: "low"
}, {
  name: "Solinco Hyper-G 17",
  family: "poly",
  gauge: "1.20 mm",
  reels: 2,
  pct: 64,
  cost: "£8.40",
  state: "ok"
}, {
  name: "Tecnifibre X-One Biphase",
  family: "multi",
  gauge: "1.30 mm",
  reels: 2,
  pct: 71,
  cost: "£14.20",
  state: "ok"
}, {
  name: "Wilson Natural Gut 16",
  family: "gut",
  gauge: "1.30 mm",
  reels: 0,
  pct: 0,
  cost: "£28.00",
  state: "out"
}, {
  name: "Yonex BG80 Power",
  family: "multi",
  gauge: "0.68 mm",
  reels: 4,
  pct: 82,
  cost: "£6.10",
  state: "ok"
}];
const FAM = {
  poly: "var(--string-poly)",
  gut: "var(--string-gut)",
  multi: "var(--string-multi)",
  hybrid: "var(--string-hybrid)"
};
function StringStock() {
  const [toast, setToast] = React.useState(true);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: "auto",
      padding: "24px 24px 48px",
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 16,
      marginBottom: 24
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Reels on the rack",
    value: "12",
    icon: "boxes"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Below reorder point",
    value: "2",
    delta: "action needed",
    deltaTone: "down",
    icon: "triangle-alert"
  })), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(StatBlock, {
    label: "Stock value",
    value: "\xA31,840",
    icon: "receipt"
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      marginBottom: 18
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.008em"
    }
  }, "String rack"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    iconLeft: "clipboard-list",
    size: "sm"
  }, "Stock take"), /*#__PURE__*/React.createElement(Button, {
    iconLeft: "plus",
    size: "sm"
  }, "Order reels")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(2,1fr)",
      gap: 16
    }
  }, STOCK.map(s => /*#__PURE__*/React.createElement(Card, {
    key: s.name,
    padding: "18px 20px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: FAM[s.family]
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 15,
      fontWeight: 500
    }
  }, s.name)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12.5,
      color: "var(--ink-500)",
      marginTop: 5
    }
  }, s.gauge, " \xB7 ", s.cost, " per set \xB7 ", s.reels, " reels")), /*#__PURE__*/React.createElement(Badge, {
    tone: s.state === "ok" ? "success" : s.state === "low" ? "warning" : "danger"
  }, s.state === "ok" ? "In stock" : s.state === "low" ? "Low" : "Out")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement(ProgressBar, {
    value: s.pct,
    max: 100,
    valueLabel: s.pct + "%",
    label: "Current reel",
    tone: s.pct < 20 ? "warning" : "brand",
    height: 5
  }))))), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 24,
      bottom: 24
    }
  }, /*#__PURE__*/React.createElement(Toast, {
    tone: "warning",
    title: "Two strings below reorder point",
    message: "RPM Blast 17 and Natural Gut 16.",
    onDismiss: () => setToast(false)
  })) : null);
}
Object.assign(window, {
  StringStock,
  STOCK
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workshop-app/StringStock.jsx", error: String((e && e.message) || e) }); }

// ui_kits/workshop-app/app.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const {
  Dialog,
  Button,
  Field,
  Input,
  Select,
  RadioGroup,
  Checkbox,
  Toast,
  Card,
  Badge,
  StatBlock
} = window.SportCraftDesignSystem_1803c2;
function Placeholder({
  title
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 48
    }
  }, /*#__PURE__*/React.createElement(Card, {
    tone: "sunken",
    padding: "32px 40px",
    style: {
      maxWidth: 420,
      textAlign: "center"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontSize: 19,
      fontWeight: 600,
      letterSpacing: "-0.008em"
    }
  }, title), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 10,
      fontSize: 14.5,
      lineHeight: 1.55,
      color: "var(--text-secondary)"
    }
  }, "Not part of this kit. Left blank rather than invented \u2014 the source material covers the job queue, job detail, customers and string stock.")));
}
function NewJobDialog({
  open,
  onClose,
  onSave
}) {
  return /*#__PURE__*/React.createElement(Dialog, {
    open: open,
    onClose: onClose,
    width: 620,
    title: "New job",
    description: "Log a frame onto the bench queue.",
    footer: /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Button, {
      variant: "ghost",
      onClick: onClose
    }, "Cancel"), /*#__PURE__*/React.createElement(Button, {
      iconLeft: "check",
      onClick: onSave
    }, "Create job"))
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: "18px 20px"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Customer",
    required: true
  }, /*#__PURE__*/React.createElement(Input, {
    iconLeft: "search",
    defaultValue: "Marta Ellis"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Frame",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["Wilson Blade 98 v9", "Wilson Blade 98 v8 (spare)"]
  })), /*#__PURE__*/React.createElement(Field, {
    label: "String",
    required: true
  }, /*#__PURE__*/React.createElement(Select, {
    options: ["Luxilon ALU Power 125", "Babolat RPM Blast 17", "Solinco Hyper-G 17", "Wilson Natural Gut 16"]
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Main",
    hint: "kg"
  }, /*#__PURE__*/React.createElement(Input, {
    suffix: "kg",
    defaultValue: "24"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Cross",
    hint: "kg"
  }, /*#__PURE__*/React.createElement(Input, {
    suffix: "kg",
    defaultValue: "23"
  }))), /*#__PURE__*/React.createElement(Field, {
    label: "Service level",
    style: {
      gridColumn: "span 2"
    }
  }, /*#__PURE__*/React.createElement(RadioGroup, {
    name: "svc",
    defaultValue: "standard",
    direction: "row",
    options: [{
      value: "standard",
      label: "Standard",
      description: "48 hours · £32"
    }, {
      value: "express",
      label: "Express",
      description: "Same day · £42"
    }, {
      value: "match",
      label: "Match day",
      description: "Within 3 hours · £52"
    }]
  })), /*#__PURE__*/React.createElement(Checkbox, {
    label: "Text customer when ready",
    defaultChecked: true,
    style: {
      gridColumn: "span 2"
    }
  })));
}
function App() {
  const [route, setRoute] = React.useState("queue");
  const [job, setJob] = React.useState(null);
  const [dialog, setDialog] = React.useState(false);
  const [toast, setToast] = React.useState(null);
  const [query, setQuery] = React.useState("");
  const title = job ? job.frame : {
    queue: "Job queue",
    bench: "At the bench",
    ready: "Ready for pickup",
    customers: "Customers",
    stock: "String stock",
    settings: "Settings"
  }[route];
  const crumb = job ? "Workshop · " + job.id : route === "customers" || route === "stock" ? "Shop" : "Workshop";
  let view;
  if (job) view = /*#__PURE__*/React.createElement(JobDetail, {
    job: job,
    onBack: () => setJob(null),
    onComplete: () => {
      setJob(null);
      setToast({
        tone: "success",
        title: "Job marked ready",
        message: "Customer notified by text."
      });
    }
  });else if (route === "queue" || route === "bench" || route === "ready") view = /*#__PURE__*/React.createElement(JobQueue, {
    query: query,
    onOpen: setJob
  });else if (route === "customers") view = /*#__PURE__*/React.createElement(Customers, null);else if (route === "stock") view = /*#__PURE__*/React.createElement(StringStock, null);else view = /*#__PURE__*/React.createElement(Placeholder, {
    title: "Settings"
  });
  return /*#__PURE__*/React.createElement(AppShell, {
    route: route,
    onRoute: r => {
      setRoute(r);
      setJob(null);
    }
  }, /*#__PURE__*/React.createElement(TopBar, {
    title: title,
    crumb: crumb,
    onSearch: setQuery,
    actions: /*#__PURE__*/React.createElement(Button, {
      size: "sm",
      iconLeft: "plus",
      onClick: () => setDialog(true)
    }, "New job")
  }), view, /*#__PURE__*/React.createElement(NewJobDialog, {
    open: dialog,
    onClose: () => setDialog(false),
    onSave: () => {
      setDialog(false);
      setToast({
        tone: "success",
        title: "Job SC-1045 created",
        message: "Added to today's bench queue."
      });
    }
  }), toast ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      right: 24,
      bottom: 24,
      zIndex: 50
    }
  }, /*#__PURE__*/React.createElement(Toast, _extends({}, toast, {
    onDismiss: () => setToast(null)
  }))) : null);
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/workshop-app/app.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.IconButton = __ds_scope.IconButton;

__ds_ns.SpecList = __ds_scope.SpecList;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Dialog = __ds_scope.Dialog;

__ds_ns.ProgressBar = __ds_scope.ProgressBar;

__ds_ns.Toast = __ds_scope.Toast;

__ds_ns.Tooltip = __ds_scope.Tooltip;

__ds_ns.Checkbox = __ds_scope.Checkbox;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.RadioGroup = __ds_scope.RadioGroup;

__ds_ns.Select = __ds_scope.Select;

__ds_ns.Switch = __ds_scope.Switch;

__ds_ns.Breadcrumbs = __ds_scope.Breadcrumbs;

__ds_ns.SideNav = __ds_scope.SideNav;

__ds_ns.Tabs = __ds_scope.Tabs;

})();
