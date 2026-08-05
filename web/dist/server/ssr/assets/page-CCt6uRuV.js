import { a as require_react, o as __toESM, t as require_jsx_runtime } from "../index.js";
//#region app/page.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var initialRows = [
	{
		hn: "M1286",
		patient: "คุณสมหญิง",
		isNew: true,
		detail: [
			"ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท",
			"ใช้ครั้งที่ 1/5",
			"เหลือ 4 ครั้ง"
		],
		scb: 28e3,
		remark: "นัดครั้งถัดไป 12 ส.ค."
	},
	{
		hn: "M0942",
		patient: "คุณบี",
		detail: [
			"คุณบีใช้ Member 8,000 บาท",
			"จาก Member ของคุณเอ",
			"ยอดก่อนใช้ 50,000 บาท · เหลือ 42,000 บาท"
		],
		member: 8e3
	},
	{
		hn: "M1108",
		patient: "คุณมุก",
		detail: [
			"ใช้มัดจำ 3,000 บาท",
			"จากมัดจำวันที่ 15 ก.ค. 2569",
			"มัดจำเดิม 5,000 บาท · เหลือ 2,000 บาท"
		],
		deposit: 3e3,
		cash: 1500
	},
	{
		hn: "M1279",
		patient: "คุณฟ้า",
		isNew: true,
		detail: ["ทรีตเมนต์ Aura Glow", "ได้รับของขวัญ Birthday Mask"],
		card: 6500
	},
	{
		hn: "M0831",
		patient: "คุณแอน",
		detail: [
			"ใช้ Dual Yellow ครั้งที่ 2/5",
			"จากคอร์ส 5 ครั้ง ราคา 28,000 บาท",
			"ซื้อวันที่ 15 มิ.ย. 2569 · เหลือ 3 ครั้ง"
		],
		outstanding: 2e3,
		scb: 2500,
		remark: "ติดตามยอดค้างชำระ"
	}
];
var money = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
function MoneyCell({ value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: "money-cell",
		children: value ? money.format(value) : ""
	});
}
function Home() {
	const [branch, setBranch] = (0, import_react.useState)("พหลโยธิน 21");
	const [query, setQuery] = (0, import_react.useState)("");
	const [rows, setRows] = (0, import_react.useState)(initialRows);
	const [composerOpen, setComposerOpen] = (0, import_react.useState)(false);
	const [notice, setNotice] = (0, import_react.useState)("");
	const filteredRows = (0, import_react.useMemo)(() => {
		const search = query.trim().toLowerCase();
		if (!search) return rows;
		return rows.filter((row) => row.hn.toLowerCase().includes(search) || row.patient.toLowerCase().includes(search) || row.detail.join(" ").toLowerCase().includes(search));
	}, [query, rows]);
	const totals = (0, import_react.useMemo)(() => rows.reduce((sum, row) => ({
		cash: sum.cash + (row.cash ?? 0),
		scb: sum.scb + (row.scb ?? 0),
		lp: sum.lp + (row.lp ?? 0),
		card: sum.card + (row.card ?? 0),
		member: sum.member + (row.member ?? 0),
		deposit: sum.deposit + (row.deposit ?? 0),
		outstanding: sum.outstanding + (row.outstanding ?? 0)
	}), {
		cash: 0,
		scb: 0,
		lp: 0,
		card: 0,
		member: 0,
		deposit: 0,
		outstanding: 0
	}), [rows]);
	const dailyGrand = totals.cash + totals.scb + totals.lp + totals.card;
	const monthToDate = {
		cash: 124500 + totals.cash,
		scb: 386e3 + totals.scb,
		lp: 72800 + totals.lp,
		card: 214500 + totals.card,
		member: 96e3 + totals.member,
		deposit: 41500 + totals.deposit,
		outstanding: 18e3 + totals.outstanding
	};
	const monthGrand = monthToDate.cash + monthToDate.scb + monthToDate.lp + monthToDate.card;
	function addDraft(event) {
		event.preventDefault();
		const form = new FormData(event.currentTarget);
		const hn = String(form.get("hn") ?? "").trim().toUpperCase();
		const patient = String(form.get("patient") ?? "").trim();
		const detail = String(form.get("detail") ?? "").trim();
		const amount = Number(form.get("amount") ?? 0);
		if (!hn || !patient || !detail) return;
		setRows((current) => [...current, {
			hn,
			patient,
			detail: [detail],
			cash: amount || void 0,
			remark: "รายการร่าง"
		}]);
		setComposerOpen(false);
		setNotice(`เพิ่มรายการร่างสำหรับ ${hn} แล้ว`);
		setTimeout(() => setNotice(""), 3200);
	}
	function printLedger() {
		const workspace = document.querySelector(".workspace");
		const printWindow = window.open("", "michiko-ledger-print", "width=1400,height=900");
		if (!workspace || !printWindow) {
			setNotice("กรุณาอนุญาตหน้าต่างป๊อปอัปเพื่อเปิดหน้าปริ้น");
			setTimeout(() => setNotice(""), 4200);
			return;
		}
		const styles = Array.from(document.querySelectorAll("link[rel=\"stylesheet\"], style")).map((node) => node.outerHTML).join("");
		printWindow.document.open();
		printWindow.document.write(`<!doctype html><html lang="th"><head><meta charset="utf-8"><base href="${window.location.origin}/"><title>สมุดรายวัน ${branch} — 15 สิงหาคม 2569</title>${styles}</head><body><main>${workspace.outerHTML}</main></body></html>`);
		printWindow.document.close();
		printWindow.focus();
		window.setTimeout(() => printWindow.print(), 700);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "topbar",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
					className: "brand",
					href: "#top",
					"aria-label": "Michiko Smart Ledger",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						className: "brand-logo",
						src: "/michiko-logo.png",
						alt: "Michiko Aesthetics",
						width: "220",
						height: "64"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
					"aria-label": "เมนูหลัก",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							className: "active",
							href: "#ledger",
							children: "สมุดรายวัน"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#patients",
							children: "คนไข้"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
							href: "#history",
							children: "ประวัติ"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "profile",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "profile-copy",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "มินตรา" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "Reception" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "avatar",
						children: "ม"
					})]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "workspace",
			id: "top",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "page-heading",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "DAILY LEDGER"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { children: "สมุดรายวัน" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "เรื่องราวของคลินิกในแต่ละวัน อ่านง่าย ตรวจสอบได้" })
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "primary-button",
						onClick: () => setComposerOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "＋"
						}), " เพิ่มรายการ"]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "toolbar",
					"aria-label": "ตัวกรองสมุดรายวัน",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "branch-picker",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "สาขา" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
								value: branch,
								onChange: (event) => setBranch(event.target.value),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "พหลโยธิน 21" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { children: "EmSphere" })]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "date-switcher",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "วันก่อนหน้า",
									children: "‹"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									className: "date-button",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "วันเสาร์" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "1 สิงหาคม 2569" })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									"aria-label": "วันถัดไป",
									children: "›"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "search-box",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								"aria-hidden": "true",
								children: "⌕"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: query,
								onChange: (event) => setQuery(event.target.value),
								placeholder: "ค้นหา HN, ชื่อ หรือรายละเอียด"
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ledger-meta",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "status-dot" }),
						" เปิดรับรายการ ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: branch })
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: rows.length }),
						" รายการ · คนไข้ใหม่ ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: rows.filter((row) => row.isNew).length }),
						" คน"
					] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "print-header",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: "/michiko-logo.png",
						alt: "Michiko Aesthetics"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: ["สมุดรายวัน — ", branch] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "วันที่ 15 สิงหาคม 2569 · เอกสารสำหรับฝ่ายบัญชี" })] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: "ledger-card",
					id: "ledger",
					"aria-label": `สมุดรายวันสาขา${branch}`,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "table-scroll",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "HN" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "คนไข้" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "details-head",
									children: "รายละเอียด"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "เงินสด" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "SCB" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "LP" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "บัตรเครดิต" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Member" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "มัดจำ" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "ค้างชำระ" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "หมายเหตุ" })
							] }) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [filteredRows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "hn-cell",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: row.hn }), row.isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "new-badge",
										children: "NEW"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "patient-cell",
									children: row.patient
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "detail-cell",
									children: row.detail.map((line, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: index === 0 ? "detail-title" : "",
										children: line
									}, line))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.cash }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.scb }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.lp }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.card }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.member }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.deposit }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MoneyCell, { value: row.outstanding }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "remark-cell",
									children: row.remark
								})
							] }, `${row.hn}-${row.detail[0]}`)), filteredRows.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 11,
								className: "empty-row",
								children: "ไม่พบรายการที่ค้นหา"
							}) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									colSpan: 3,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "รวมประจำวัน" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: branch })]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.cash ? money.format(totals.cash) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.scb ? money.format(totals.scb) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.lp ? money.format(totals.lp) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.card ? money.format(totals.card) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.member ? money.format(totals.member) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.deposit ? money.format(totals.deposit) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: totals.outstanding ? money.format(totals.outstanding) : "" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {})
							] }) })
						] })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "summary-section",
					"aria-labelledby": "daily-summary-title",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "summary-heading",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "eyebrow",
							children: "DAILY SUMMARY"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							id: "daily-summary-title",
							children: "สรุปยอดประจำวัน"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["15 สิงหาคม 2569 · ", branch] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "summary-grid",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card total-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ยอดรับรวมวันนี้" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(dailyGrand) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card cash-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "เงินสด" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.cash) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card scb-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "โอน · SCB" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.scb) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card lp-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "โอน · LP" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.lp) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card card-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "บัตรเครดิต" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.card) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card member-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ใช้ Member" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.member) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card deposit-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ใช้มัดจำ" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.deposit) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
								className: "summary-card outstanding-card",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "ค้างชำระ" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: money.format(totals.outstanding) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: "บาท" })
								]
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "summary-section monthly-section",
					"aria-labelledby": "monthly-summary-title",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "summary-heading",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "eyebrow",
								children: "MONTH TO DATE"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								id: "monthly-summary-title",
								children: "ยอดสะสมประจำเดือน"
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "1–15 สิงหาคม 2569 · สะสมต่อเนื่องถึงสิ้นเดือน" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "monthly-table-wrap",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
								className: "monthly-table",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "ยอดรับรวม" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "เงินสด" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "โอน SCB" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "โอน LP" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "บัตรเครดิต" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "Member" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "มัดจำ" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", { children: "ค้างชำระ" })
								] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthGrand) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.cash) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.scb) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.lp) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.card) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.member) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.deposit) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { children: money.format(monthToDate.outstanding) })
								] }) })]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "carry-note",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "↗" }), " ยอดวันนี้จะถูกรวมเข้าสะสมอัตโนมัติ และเริ่มรอบใหม่ในวันที่ 1 ของเดือนถัดไป"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bottom-print-action",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "icon-button print-button",
						"aria-label": "ปริ้นสมุดรายวัน",
						onClick: printLedger,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "▣"
						}), " ปริ้น"]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
					className: "page-footer",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "บันทึกล่าสุดเมื่อสักครู่" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["ยอดรวมเฉพาะสาขา ", branch] })]
				})
			]
		}),
		composerOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "modal-backdrop",
			role: "presentation",
			onMouseDown: () => setComposerOpen(false),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "composer",
				role: "dialog",
				"aria-modal": "true",
				"aria-labelledby": "composer-title",
				onMouseDown: (event) => event.stopPropagation(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "composer-header",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "eyebrow",
						children: "NEW ENTRY"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						id: "composer-title",
						children: "เพิ่มรายการวันนี้"
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "close-button",
						onClick: () => setComposerOpen(false),
						"aria-label": "ปิด",
						children: "×"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: addDraft,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "field-grid",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["HN ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "*" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "hn",
								placeholder: "เช่น M1289",
								required: true,
								autoFocus: true
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["ชื่อที่แสดง ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "*" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								name: "patient",
								placeholder: "ชื่อหรือนicknameตามใบเสร็จ",
								required: true
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["เรื่องราวของรายการ ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "*" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							name: "detail",
							rows: 4,
							placeholder: "เช่น ซื้อคอร์ส Dual Yellow 5 ครั้ง ราคา 28,000 บาท",
							required: true
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "เงินสด" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							name: "amount",
							inputMode: "numeric",
							type: "number",
							min: "0",
							placeholder: "เว้นว่างถ้าไม่มี"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "helper-note",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "✦" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "ระบบจะช่วยเขียนเรื่องราว" }), " การอ้างอิงคอร์ส มัดจำ และ Member จะคำนวณอัตโนมัติในขั้นพัฒนาถัดไป"] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "form-actions",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: "secondary-button",
								onClick: () => setComposerOpen(false),
								children: "ยกเลิก"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "primary-button",
								type: "submit",
								children: "เพิ่มเป็นรายการร่าง"
							})]
						})
					]
				})]
			})
		}),
		notice && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "toast",
			role: "status",
			children: ["✓ ", notice]
		})
	] });
}
//#endregion
export { Home as default };
