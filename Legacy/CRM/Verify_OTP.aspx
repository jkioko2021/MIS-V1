<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Verify_OTP.aspx.vb" Inherits="Verify_OTP" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">

<html xmlns="http://www.w3.org/1999/xhtml">
<!-- Include Bootstrap CSS and JS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
<head runat="server">
    <title></title>
</head>
<body>
    <form id="form1" runat="server">
    <div>
   <!-- Button to trigger the modal -->
<asp:Button ID="btnShowPopup" runat="server" Text="Enter OTP" OnClientClick="$('#otpModal').modal('show'); return false;" CssClass="btn btn-primary"  />

<div class="modal fade" id="otpModal" tabindex="-1" role="dialog" aria-labelledby="otpModalLabel">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
            <asp:Panel ID="Panel1" runat="server" DefaultButton="btnSubmitOtp">
                <div class="modal-header">
                    <h5 class="modal-title">Enter OTP</h5>
                </div>
                <div class="modal-body">
                    <asp:TextBox ID="txtOtp" runat="server" CssClass="form-control" Placeholder="Enter OTP" />
                </div>
                <div class="modal-footer">
                    <asp:Button ID="btnSubmitOtp" runat="server" Text="Submit" CssClass="btn btn-primary" OnClick="btnSubmitOtp_Click" />
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Cancel</button>
                </div>
            </asp:Panel>
        </div>
    </div>
</div>

<asp:Label ID="lblMessage" runat="server" CssClass="text-danger" />
    </div>
    </form>
</body>
</html>
