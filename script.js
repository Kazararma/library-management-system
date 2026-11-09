const BOOKS_KEY = "lms_books";
const TX_KEY = "lms_transactions";

const SEED_BOOKS = [
  { id: "B101", title: "Introduction to Algorithms", author: "Thomas H. Cormen", year: 2009, copies: 3 },
  { id: "B102", title: "Database System Concepts", author: "Abraham Silberschatz", year: 2019, copies: 2 },
  { id: "B103", title: "Operating System Concepts", author: "Abraham Silberschatz", year: 2018, copies: 1 },
  { id: "B104", title: "Computer Networks", author: "Andrew S. Tanenbaum", year: 2010, copies: 0 }
];

let books = [];
let transactions = [];

function loadData() {
  try {
    const storedBooks = localStorage.getItem(BOOKS_KEY);
    if (!storedBooks) {
      books = [...SEED_BOOKS];
      saveData();
    } else {
      const parsed = JSON.parse(storedBooks);
      if (Array.isArray(parsed) && parsed.length > 0) {
        books = parsed;
      } else {
        books = [...SEED_BOOKS];
        saveData();
      }
    }
  } catch (err) {
    console.error("Error reading books from localStorage, restoring seed data:", err);
    books = [...SEED_BOOKS];
    saveData();
  }

  try {
    const storedTx = localStorage.getItem(TX_KEY);
    if (!storedTx) {
      transactions = [];
      localStorage.setItem(TX_KEY, JSON.stringify(transactions));
    } else {
      const parsedTx = JSON.parse(storedTx);
      transactions = Array.isArray(parsedTx) ? parsedTx : [];
    }
  } catch (err) {
    console.error("Error reading transactions from localStorage:", err);
    transactions = [];
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  }
}

function saveData() {
  try {
    localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
    localStorage.setItem(TX_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error("Error saving data to localStorage:", err);
  }
}

function normalizeId(str) {
  return str ? String(str).trim().toLowerCase() : "";
}

function findBook(id) {
  const target = normalizeId(id);
  return books.find(b => normalizeId(b.id) === target);
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function nextTransactionId() {
  if (!transactions.length) return 1;
  const highest = Math.max(...transactions.map(t => Number(t.transactionId) || 0));
  return highest + 1;
}

function findActiveTransaction(bookId, studentId) {
  const normBook = normalizeId(bookId);
  const normStudent = normalizeId(studentId);
  return transactions.find(
    t => t.status === "Issued" &&
         normalizeId(t.bookId) === normBook &&
         normalizeId(t.studentId) === normStudent
  );
}

function showMessage(text, type) {
  const messageEl = document.getElementById("message");
  if (!messageEl) return;
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function clearMessage() {
  const messageEl = document.getElementById("message");
  if (!messageEl) return;
  messageEl.textContent = "";
  messageEl.className = "message hidden";
}

function showTab(tabId) {
  const navButtons = document.querySelectorAll("#navbar .nav-btn");
  navButtons.forEach(btn => {
    if (btn.getAttribute("data-tab") === tabId) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  const sections = document.querySelectorAll(".tab-section");
  sections.forEach(section => {
    if (section.id === tabId) {
      section.classList.add("active");
    } else {
      section.classList.remove("active");
    }
  });

  clearMessage();

  if (tabId === "dashboard") {
    renderDashboard();
  } else if (tabId === "all-books") {
    renderBooksTable();
  } else if (tabId === "search") {
    const searchInput = document.getElementById("search-input");
    const query = searchInput ? searchInput.value : "";
    const results = searchBooks(query);
    renderSearchResults(results, query);
  } else if (tabId === "issued") {
    renderIssuedTable();
  }
}

function renderDashboard() {
  const totalTitles = books.length;
  const totalCopies = books.reduce((sum, b) => sum + (Number(b.copies) || 0), 0);
  const activeIssues = transactions.filter(t => t.status === "Issued").length;
  const outOfStockTitles = books.filter(b => Number(b.copies) === 0).length;

  const titlesSpan = document.getElementById("stat-titles");
  const copiesSpan = document.getElementById("stat-copies");
  const issuedSpan = document.getElementById("stat-issued");
  const outOfStockSpan = document.getElementById("stat-outofstock");

  if (titlesSpan) titlesSpan.textContent = totalTitles;
  if (copiesSpan) copiesSpan.textContent = totalCopies;
  if (issuedSpan) issuedSpan.textContent = activeIssues;
  if (outOfStockSpan) outOfStockSpan.textContent = outOfStockTitles;
}

function renderBooksTable() {
  const tbody = document.getElementById("books-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (books.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No books in the library yet.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  books.forEach(book => {
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = book.id;
    row.appendChild(idCell);

    const titleCell = document.createElement("td");
    titleCell.textContent = book.title;
    row.appendChild(titleCell);

    const authorCell = document.createElement("td");
    authorCell.textContent = book.author;
    row.appendChild(authorCell);

    const yearCell = document.createElement("td");
    yearCell.textContent = book.year;
    row.appendChild(yearCell);

    const copiesCell = document.createElement("td");
    copiesCell.textContent = book.copies;
    if (Number(book.copies) === 0) {
      copiesCell.className = "low-stock";
    }
    row.appendChild(copiesCell);

    tbody.appendChild(row);
  });
}

function validateBook(data) {
  const errors = [];
  const id = (data.id || "").trim();
  const title = (data.title || "").trim();
  const author = (data.author || "").trim();
  const yearStr = data.year !== undefined && data.year !== null ? String(data.year).trim() : "";
  const copiesStr = data.copies !== undefined && data.copies !== null ? String(data.copies).trim() : "";

  if (!id || !title || !author || yearStr === "" || copiesStr === "") {
    errors.push("All fields are required.");
    return errors;
  }

  if (findBook(id)) {
    errors.push(`Book ID '${id}' already exists.`);
  }

  const yearNum = Number(yearStr);
  if (isNaN(yearNum) || !Number.isInteger(yearNum)) {
    errors.push("Publication year must be a whole number.");
  } else if (yearNum <= 0) {
    errors.push("Publication year must be a positive number.");
  } else if (yearNum > new Date().getFullYear()) {
    errors.push("Publication year cannot be in the future.");
  }

  const copiesNum = Number(copiesStr);
  if (isNaN(copiesNum) || !Number.isInteger(copiesNum)) {
    errors.push("Available copies must be a whole number.");
  } else if (copiesNum < 0) {
    errors.push("Available copies cannot be negative.");
  }

  return errors;
}

function initAddBookForm() {
  const form = document.getElementById("add-book-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const idInput = document.getElementById("book-id");
    const titleInput = document.getElementById("book-title");
    const authorInput = document.getElementById("book-author");
    const yearInput = document.getElementById("book-year");
    const copiesInput = document.getElementById("book-copies");

    const rawData = {
      id: idInput ? idInput.value : "",
      title: titleInput ? titleInput.value : "",
      author: authorInput ? authorInput.value : "",
      year: yearInput ? yearInput.value : "",
      copies: copiesInput ? copiesInput.value : ""
    };

    const errors = validateBook(rawData);
    if (errors.length > 0) {
      showMessage(errors.join(" "), "error");
      return;
    }

    const newBook = {
      id: rawData.id.trim(),
      title: rawData.title.trim(),
      author: rawData.author.trim(),
      year: Number(rawData.year),
      copies: Number(rawData.copies)
    };

    books.push(newBook);
    saveData();
    showMessage(`Book '${newBook.title}' added successfully.`, "success");
    form.reset();
    renderDashboard();
    renderBooksTable();
  });
}

function searchBooks(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  return books.filter(b =>
    normalizeId(b.id).includes(q) ||
    (b.title && b.title.toLowerCase().includes(q))
  );
}

function renderSearchResults(results, query) {
  const tbody = document.getElementById("search-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const trimmedQuery = (query || "").trim();

  if (!trimmedQuery) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "Type a Book ID or Title to search";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  if (results.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = `No book found matching '${trimmedQuery}'`;
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  results.forEach(book => {
    const row = document.createElement("tr");

    const idCell = document.createElement("td");
    idCell.textContent = book.id;
    row.appendChild(idCell);

    const titleCell = document.createElement("td");
    titleCell.textContent = book.title;
    row.appendChild(titleCell);

    const authorCell = document.createElement("td");
    authorCell.textContent = book.author;
    row.appendChild(authorCell);

    const yearCell = document.createElement("td");
    yearCell.textContent = book.year;
    row.appendChild(yearCell);

    const copiesCell = document.createElement("td");
    copiesCell.textContent = book.copies;
    if (Number(book.copies) === 0) {
      copiesCell.className = "low-stock";
    }
    row.appendChild(copiesCell);

    const availCell = document.createElement("td");
    if (Number(book.copies) > 0) {
      const copyWord = Number(book.copies) === 1 ? "copy" : "copies";
      availCell.textContent = `Available (${book.copies} ${copyWord})`;
      availCell.className = "status-available";
    } else {
      availCell.textContent = "Not available";
      availCell.className = "status-unavailable";
    }
    row.appendChild(availCell);

    tbody.appendChild(row);
  });
}

function initSearch() {
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");

  function triggerSearch() {
    const query = searchInput ? searchInput.value : "";
    const results = searchBooks(query);
    renderSearchResults(results, query);
  }

  if (searchInput) {
    searchInput.addEventListener("input", triggerSearch);
  }

  if (searchBtn) {
    searchBtn.addEventListener("click", triggerSearch);
  }
}

function issueBook(bookId, studentId) {
  const bId = (bookId || "").trim();
  const sId = (studentId || "").trim();

  if (!bId || !sId) {
    return { success: false, message: "Book ID and Student ID are required." };
  }

  const book = findBook(bId);
  if (!book) {
    return { success: false, message: `Book ID '${bId}' does not exist.` };
  }

  if (Number(book.copies) <= 0) {
    return { success: false, message: `No copies of '${book.title}' are currently available.` };
  }

  const activeTx = findActiveTransaction(bId, sId);
  if (activeTx) {
    return { success: false, message: `Student ${sId} has already issued this book and not returned it.` };
  }

  book.copies = Number(book.copies) - 1;

  const newTx = {
    transactionId: nextTransactionId(),
    bookId: book.id,
    studentId: sId,
    issueDate: todayString(),
    returnDate: null,
    status: "Issued"
  };

  transactions.push(newTx);
  saveData();

  return {
    success: true,
    message: `Book '${book.title}' issued to student ${sId}. Remaining copies: ${book.copies}.`
  };
}

function initIssueForm() {
  const form = document.getElementById("issue-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const bookIdInput = document.getElementById("issue-book-id");
    const studentIdInput = document.getElementById("issue-student-id");

    const bookId = bookIdInput ? bookIdInput.value : "";
    const studentId = studentIdInput ? studentIdInput.value : "";

    const result = issueBook(bookId, studentId);
    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    showMessage(result.message, "success");
    form.reset();
    renderDashboard();
    renderBooksTable();
    renderIssuedTable();
  });
}

function returnBook(bookId, studentId) {
  const bId = (bookId || "").trim();
  const sId = (studentId || "").trim();

  if (!bId || !sId) {
    return { success: false, message: "Book ID and Student ID are required." };
  }

  const activeTx = findActiveTransaction(bId, sId);
  if (!activeTx) {
    return { success: false, message: "No active issue record found for this Book ID and Student ID." };
  }

  activeTx.status = "Returned";
  activeTx.returnDate = todayString();

  const book = findBook(activeTx.bookId);
  if (book) {
    book.copies = Number(book.copies) + 1;
  }

  saveData();

  const title = book ? book.title : activeTx.bookId;
  return {
    success: true,
    message: `Book '${title}' successfully returned by student ${sId}.`
  };
}

function initReturnForm() {
  const form = document.getElementById("return-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const bookIdInput = document.getElementById("return-book-id");
    const studentIdInput = document.getElementById("return-student-id");

    const bookId = bookIdInput ? bookIdInput.value : "";
    const studentId = studentIdInput ? studentIdInput.value : "";

    const result = returnBook(bookId, studentId);
    if (!result.success) {
      showMessage(result.message, "error");
      return;
    }

    showMessage(result.message, "success");
    form.reset();
    renderDashboard();
    renderBooksTable();
    renderIssuedTable();
  });
}

function renderIssuedTable() {
  const tbody = document.getElementById("issued-tbody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const activeTransactions = transactions.filter(t => t.status === "Issued");

  if (activeTransactions.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No books are currently issued.";
    row.appendChild(cell);
    tbody.appendChild(row);
    return;
  }

  activeTransactions.forEach(tx => {
    const row = document.createElement("tr");

    const bookIdCell = document.createElement("td");
    bookIdCell.textContent = tx.bookId;
    row.appendChild(bookIdCell);

    const book = findBook(tx.bookId);
    const titleCell = document.createElement("td");
    titleCell.textContent = book ? book.title : "(Unknown)";
    row.appendChild(titleCell);

    const studentCell = document.createElement("td");
    studentCell.textContent = tx.studentId;
    row.appendChild(studentCell);

    const dateCell = document.createElement("td");
    dateCell.textContent = tx.issueDate || "";
    row.appendChild(dateCell);

    const statusCell = document.createElement("td");
    const badge = document.createElement("span");
    badge.className = "badge-issued";
    badge.textContent = "Issued";
    statusCell.appendChild(badge);
    row.appendChild(statusCell);

    tbody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadData();

  const navButtons = document.querySelectorAll("#navbar .nav-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      if (tab) {
        showTab(tab);
      }
    });
  });

  initAddBookForm();
  initSearch();
  initIssueForm();
  initReturnForm();

  showTab("dashboard");
});
