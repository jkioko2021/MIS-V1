<%@ Page Language="VB" AutoEventWireup="false" CodeFile="Login.aspx.vb" Inherits="LoginRedesigned" %>

<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<!-- Include Bootstrap CSS and JS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css">
<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.min.js"></script>
<head id="Head1" runat="server">

    <title>..::Mis-Reporting System::..</title>
     <script language="javascript" type="text/javascript">
         function mp_onload() {
             if (window.BeginPageLoad != null)
                 window.BeginPageLoad();
         }
  </script>
    <link href="login.css" rel="stylesheet" type="text/css" />    
     <link rel="shortcut icon" href="~/Images/favicon.ico"/>
    <style type="text/css">
        .style1
        {
            height: 148px;
        }
        .style2
        {
            width: 211px;
        }
        .style4
        {
            height: 20px;
        }
        .style5
        {
            width: 354px;
            height: 327px;
        }
        .style6
        {
            width: 136px;
        }
        .style7
        {
            height: 10px;
        }
        .style8
        {
            height: 54px;
        }
    </style>
</head>
<body>
    <form id="form1" runat="server" autocomplete = "off">
    <center>
    <div id="loginbody">
            <asp:ScriptManager ID="ScriptManager1" runat="server">
            </asp:ScriptManager>
            <telerik:RadFormDecorator ID="RadFormDecorator1" Runat="server" Skin="Hay" />
             <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="Red" 
                Text="Please Wait...." Font-Size="Large"></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <div id="login" 
                
                style="margin-top: 42px; height: 314px; background-image: url('Images/M3.gif'); background-repeat: no-repeat; width: 482px;" 
                align="center">
        
        <div id="controls" style="height: 311px;">
            <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                    <table style="border: 1px solid white; margin-left: 0px; height: 270px;">
                         <tr>
                            <td align="center" class="style5">
                                 <table border="0" cellpadding="0" cellspacing="0">
                                    <!--DWLayoutTable-->                                    
                                    <tr>
                                        <td colspan="2" class="style1">
                                            <div style="height: 144px; width: 442px">
                                                <table align="left" style="width: 316px; height: 121px;">
                                                    <tr>
                                                        <td class="style6">
                                                            &nbsp;</td>
                                                        <td class="style2">
                                                            &nbsp;</td>
                                                        <td style="width: 28px;">
                                                            &nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <td align="right" class="style6">
                                                            <asp:Label ID="Label6" runat="server" Font-Bold="True" ForeColor="White" 
                                                                Text="Login.." Width="108px"></asp:Label>
                                                        </td>
                                                        <td class="style2">
                                                            &nbsp;</td>
                                                        <td style="width: 28px;">
                                                            &nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <td align="right" class="style6">
                                                            <asp:Label ID="Label4" runat="server" Font-Bold="True" ForeColor="White" 
                                                                Text="UserName" Width="108px"></asp:Label>
                                                        </td>
                                                        <td class="style2">
                                                            <telerik:RadTextBox ID="txtusername" Runat="server" Skin="Web20" Width="216px">
                                                            </telerik:RadTextBox>
                                                        </td>
                                                        <td style="width: 28px;">
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td align="right" class="style6">
                                                            <asp:Label ID="Label5" runat="server" Font-Bold="True" ForeColor="White" 
                                                                Text="Password" Width="108px"></asp:Label>
                                                        </td>
                                                        <td class="style2">
                                                            <telerik:RadTextBox ID="txtpassword" Runat="server" Skin="Web20" 
                                                                TextMode="Password" Width="216px">
                                                            </telerik:RadTextBox>
                                                        </td>
                                                        <td style="width: 28px">
                                                            &nbsp;</td>
                                                    </tr>
                                                    <tr>
                                                        <td align="right" colspan="2">
                                                            <telerik:RadButton ID="cmdLogin" runat="server" CssClass="inputbutton" 
                                                                Skin="Simple" Text="Login" ValidationGroup="LoginControl" Width="100px" 
                                                                Height="50px">
                                                            </telerik:RadButton>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="height: 49px; width: 11px;">
                                        </td>
                                        <td>
                                            &nbsp;</td>
                                    </tr>
                                    <tr>
                                        <td align="center" colspan="2" class="style7">
                                            <asp:Label ID="Lbl1" runat="server" Font-Size="Large" style="color: #FF0000"></asp:Label>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colspan="2" align="left">
                                            IT on Call:
                                            <asp:Label ID="name" runat="server" Font-Bold="True" Font-Size="Small" 
                                                ForeColor="White" Text="UserName" Width="297px"></asp:Label>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td align="left" colspan="2" class="style4">
                                            <cc1:ConfirmButtonExtender id="ConfirmButtonExtender1" runat="server" ConfirmText="Are Sure You want to Generate New Password?" TargetControlID="lnkpass">
                                                </cc1:ConfirmButtonExtender> 
                                            <asp:LinkButton ID="lnkpass" runat="server" ForeColor="White" 
                                                style="font-style: italic">Forgot Password</asp:LinkButton>
                                            </td>
                                    </tr>
                                     <tr>
                                         <td align="left" class="style8" colspan="2">
                                             </td>
                                     </tr>
                                </table>   
                            </td>
                        </tr>
                     </table>

                     <asp:Label ID="lblMessage" runat="server" ForeColor="Red"></asp:Label>  


 <div id="rounded">
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
                    &nbsp;<asp:Button ID="btnCancel" runat="server" CssClass="btn btn-Secondary" 
                        OnClick="btnCancel_Click" Text="Cancel" />
                </div>
            </asp:Panel>
        </div>
    </div>

    </div>
   
                </ContentTemplate>
            </asp:UpdatePanel>
        </div>
    </div>
   
    </center>
    <p>
        &nbsp;</p>
    </form>
</body>
</html>


