"""TratoUY backend API tests"""
import os
import uuid
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "https://marketplace-local-uy.preview.emergentagent.com").rstrip("/")
API = f"{BASE}/api"
ADMIN_EMAIL = "admin@tratouy.com"
ADMIN_PASSWORD = "Admin1234!"


@pytest.fixture(scope="session")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def seller():
    email = f"TEST_seller_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test1234!", "name": "TEST Seller",
        "department": "Montevideo", "age_confirmed": True
    })
    assert r.status_code == 200, r.text
    d = r.json()
    return {"id": d["user"]["id"], "token": d["token"], "email": email}


@pytest.fixture(scope="session")
def buyer():
    email = f"TEST_buyer_{uuid.uuid4().hex[:8]}@test.com"
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "Test1234!", "name": "TEST Buyer",
        "department": "Canelones", "age_confirmed": True
    })
    assert r.status_code == 200
    d = r.json()
    return {"id": d["user"]["id"], "token": d["token"], "email": email}


def H(token): return {"Authorization": f"Bearer {token}"}


# --- META & health ---
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200 and r.json()["app"] == "TratoUY"

def test_departments():
    r = requests.get(f"{API}/meta/departments")
    assert r.status_code == 200
    assert len(r.json()["departments"]) == 19

def test_categories():
    r = requests.get(f"{API}/meta/categories")
    assert r.status_code == 200
    assert len(r.json()["categories"]) == 6


# --- AUTH ---
def test_register_age_required():
    r = requests.post(f"{API}/auth/register", json={
        "email": f"TEST_noage_{uuid.uuid4().hex[:6]}@t.com",
        "password": "Test1234!", "name": "x", "department": "Montevideo",
        "age_confirmed": False
    })
    assert r.status_code == 400

def test_register_duplicate(seller):
    r = requests.post(f"{API}/auth/register", json={
        "email": seller["email"], "password": "Test1234!", "name": "x",
        "department": "Montevideo", "age_confirmed": True
    })
    assert r.status_code == 409

def test_login_admin_and_cookie():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    assert "token" in r.json() and r.json()["user"]["role"] == "admin"
    assert "access_token" in r.cookies

def test_login_bad_pwd():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401

def test_me_requires_auth():
    assert requests.get(f"{API}/auth/me").status_code == 401

def test_me_with_token(seller):
    r = requests.get(f"{API}/auth/me", headers=H(seller["token"]))
    assert r.status_code == 200 and r.json()["user"]["id"] == seller["id"]


# --- LISTINGS ---
LISTING_ID = {"id": None}

def test_create_listing(seller):
    r = requests.post(f"{API}/listings", headers=H(seller["token"]), json={
        "title": "TEST iPhone 12 mint", "description": "Perfecto estado, batería 95%",
        "price": 15000.0, "category": "tech", "department": "Montevideo",
        "zone": "Pocitos", "images": []
    })
    assert r.status_code == 200, r.text
    LISTING_ID["id"] = r.json()["listing"]["id"]

def test_prohibited_words(seller):
    r = requests.post(f"{API}/listings", headers=H(seller["token"]), json={
        "title": "Vendo cocaina premium", "description": "10 gramos disponibles ahora",
        "price": 100.0, "category": "others", "department": "Montevideo", "zone": "x", "images": []
    })
    assert r.status_code == 400

def test_list_filters():
    r = requests.get(f"{API}/listings", params={"department": "Montevideo", "category": "tech"})
    assert r.status_code == 200
    ids = [x["id"] for x in r.json()["listings"]]
    assert LISTING_ID["id"] in ids

def test_get_listing_with_seller(seller):
    r = requests.get(f"{API}/listings/{LISTING_ID['id']}")
    assert r.status_code == 200
    assert r.json()["listing"]["seller"]["id"] == seller["id"]

def test_delete_listing_not_owner(buyer):
    r = requests.delete(f"{API}/listings/{LISTING_ID['id']}", headers=H(buyer["token"]))
    assert r.status_code == 403


# --- OFFERS ---
OFFER_ID = {"id": None}

def test_seller_cant_offer_own(seller):
    r = requests.post(f"{API}/offers", headers=H(seller["token"]),
                      json={"listing_id": LISTING_ID["id"], "amount": 100.0})
    assert r.status_code == 400

def test_buyer_creates_offer(buyer):
    r = requests.post(f"{API}/offers", headers=H(buyer["token"]),
                      json={"listing_id": LISTING_ID["id"], "amount": 13000.0, "message": "hola"})
    assert r.status_code == 200
    OFFER_ID["id"] = r.json()["offer"]["id"]
    assert r.json()["offer"]["status"] == "pending"

def test_offer_received_sent(seller, buyer):
    rr = requests.get(f"{API}/offers/received", headers=H(seller["token"]))
    assert rr.status_code == 200
    assert any(o["id"] == OFFER_ID["id"] for o in rr.json()["offers"])
    rs = requests.get(f"{API}/offers/sent", headers=H(buyer["token"]))
    assert rs.status_code == 200
    assert any(o["id"] == OFFER_ID["id"] for o in rs.json()["offers"])

def test_offer_action_forbidden_for_buyer(buyer):
    r = requests.post(f"{API}/offers/{OFFER_ID['id']}/action",
                      headers=H(buyer["token"]), json={"action": "accept"})
    assert r.status_code == 403

def test_offer_action_accept(seller):
    r = requests.post(f"{API}/offers/{OFFER_ID['id']}/action",
                      headers=H(seller["token"]), json={"action": "accept"})
    assert r.status_code == 200 and r.json()["status"] == "accepted"


# --- CHAT ---
def test_self_message_blocked(seller):
    r = requests.post(f"{API}/messages", headers=H(seller["token"]),
                      json={"listing_id": LISTING_ID["id"], "to_user_id": seller["id"], "text": "x"})
    assert r.status_code == 400

def test_send_and_thread(seller, buyer):
    r = requests.post(f"{API}/messages", headers=H(buyer["token"]),
                      json={"listing_id": LISTING_ID["id"], "to_user_id": seller["id"], "text": "Hola"})
    assert r.status_code == 200
    r2 = requests.post(f"{API}/messages", headers=H(seller["token"]),
                       json={"listing_id": LISTING_ID["id"], "to_user_id": buyer["id"], "text": "Que tal"})
    assert r2.status_code == 200
    rt = requests.get(f"{API}/messages/{LISTING_ID['id']}/{seller['id']}", headers=H(buyer["token"]))
    assert rt.status_code == 200 and len(rt.json()["messages"]) >= 2
    rc = requests.get(f"{API}/conversations", headers=H(buyer["token"]))
    assert rc.status_code == 200 and len(rc.json()["conversations"]) >= 1


# --- RATINGS ---
def test_rating_self_blocked(seller):
    r = requests.post(f"{API}/ratings", headers=H(seller["token"]),
                      json={"seller_id": seller["id"], "listing_id": LISTING_ID["id"], "stars": 5})
    assert r.status_code == 400

def test_rating_create_and_dup(buyer, seller):
    r = requests.post(f"{API}/ratings", headers=H(buyer["token"]),
                      json={"seller_id": seller["id"], "listing_id": LISTING_ID["id"], "stars": 5, "comment": "Top"})
    assert r.status_code == 200
    r2 = requests.post(f"{API}/ratings", headers=H(buyer["token"]),
                       json={"seller_id": seller["id"], "listing_id": LISTING_ID["id"], "stars": 4})
    assert r2.status_code == 409
    ru = requests.get(f"{API}/users/{seller['id']}")
    assert ru.json()["user"]["rating_avg"] == 5.0 and ru.json()["user"]["rating_count"] == 1


# --- REPORTS ---
REPORT_ID = {"id": None}

def test_create_report(buyer):
    r = requests.post(f"{API}/reports", headers=H(buyer["token"]),
                      json={"target_type": "listing", "target_id": LISTING_ID["id"], "reason": "Test reporte"})
    assert r.status_code == 200


# --- ADMIN ---
def test_admin_non_admin_blocked(buyer):
    r = requests.get(f"{API}/admin/stats", headers=H(buyer["token"]))
    assert r.status_code == 403

def test_admin_stats(admin_token):
    r = requests.get(f"{API}/admin/stats", headers=H(admin_token))
    assert r.status_code == 200
    assert "users" in r.json() and "listings" in r.json()

def test_admin_reports_users_listings(admin_token):
    for ep in ["reports", "users", "listings"]:
        r = requests.get(f"{API}/admin/{ep}", headers=H(admin_token))
        assert r.status_code == 200

def test_admin_ban_unban(admin_token, buyer):
    rb = requests.post(f"{API}/admin/users/{buyer['id']}/ban", headers=H(admin_token))
    assert rb.status_code == 200
    # banned user cannot use auth/me
    rm = requests.get(f"{API}/auth/me", headers=H(buyer["token"]))
    assert rm.status_code == 403
    # login banned user blocked
    rl = requests.post(f"{API}/auth/login", json={"email": buyer["email"], "password": "Test1234!"})
    assert rl.status_code == 403
    ru = requests.post(f"{API}/admin/users/{buyer['id']}/unban", headers=H(admin_token))
    assert ru.status_code == 200

def test_admin_resolve_report(admin_token):
    rr = requests.get(f"{API}/admin/reports", headers=H(admin_token))
    reports = rr.json()["reports"]
    if reports:
        rid = reports[0]["id"]
        r = requests.post(f"{API}/admin/reports/{rid}/resolve", headers=H(admin_token))
        assert r.status_code == 200

def test_admin_delete_listing(admin_token):
    r = requests.delete(f"{API}/admin/listings/{LISTING_ID['id']}", headers=H(admin_token))
    assert r.status_code == 200
    g = requests.get(f"{API}/listings/{LISTING_ID['id']}")
    assert g.status_code == 404
