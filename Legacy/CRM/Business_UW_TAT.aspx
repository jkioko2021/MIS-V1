<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_UW_TAT.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
        <ContentTemplate>
            <table style="width: 100%">
                <tr>
                    <td align="center" bgcolor="#333333" colspan="4">
                        <asp:Label ID="Label6" runat="server" Font-Bold="True" Font-Size="Medium" 
                            ForeColor="Silver" style="font-weight: 700" 
                            Text="TAT-Medical Uw"></asp:Label>
                    </td>
                </tr>
                <tr>
                    <td colspan="3">
                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                            Width="1102px">
                            <table style="width: 100%">
                                <tr>
                                    <td style="width: 2958px">
                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                            Text="Search By"></asp:Label>
                                    </td>
                                    <td>
                                        <telerik:RadDatePicker ID="dtfrom" Runat="server" MinDate="" Skin="Sunset">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td style="width: 5px">
                                        <telerik:RadDatePicker ID="dtto" Runat="server" MinDate="" Skin="Sunset">
                                            <Calendar Skin="Sunset" UseColumnHeadersAsSelectors="False" 
                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                            </Calendar>
                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                            </DateInput>
                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                        </telerik:RadDatePicker>
                                    </td>
                                    <td>
                                        <telerik:RadComboBox ID="cbosearch" Runat="server" Skin="Simple" 
                                            style="margin-left: 0px">
                                            <Items>
                                                <telerik:RadComboBoxItem runat="server" Owner="cbosearch" Text="2024" 
                                                    Value="2024" />
                                                <telerik:RadComboBoxItem runat="server" Owner="cbosearch" Text="2025" 
                                                    Value="2025" />
                                                <telerik:RadComboBoxItem runat="server" Text="2026" Value="2026" />
                                            </Items>
                                        </telerik:RadComboBox>
                                    </td>
                                    <td>
                                        <telerik:RadButton ID="SEARCH" runat="server" Text="Search">
                                        </telerik:RadButton>
                                    </td>
                                </tr>
                            </table>
                        </asp:Panel>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <telerik:RadTabStrip ID="RadTabStrip1" runat="server" Skin="Simple" 
                            Width="1100px" MultiPageID="RadMultiPage1" SelectedIndex="0">
                            <Tabs>
                                <telerik:RadTab runat="server" PageViewID="V1" Text="Medical Uw" Selected="True" 
                                    SelectedIndex="0">
                                </telerik:RadTab>
                            </Tabs>
                        </telerik:RadTabStrip>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="3">
                        <telerik:RadMultiPage ID="RadMultiPage1" Runat="server" Width="1100px">
                             <telerik:RadPageView ID="V1" runat="server" Selected="True">
                                <asp:Panel ID="Panel1" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                    Height="100%" style="font-weight: 700" Width="1121px">
                                    <table style="width: 99%">
                                        <tr>
                                            <td class="style8">
                                                <asp:Panel ID="Panel4" runat="server" Height="100%" ScrollBars="Both" 
                                                    Width="100%">
                                                    <telerik:RadGrid ID="GDMED_UW" runat="server" AllowPaging="True" CellSpacing="0" 
                                                        GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                        <MasterTableView AutoGenerateColumns="False" >
                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                            </RowIndicatorColumn>
                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                            </ExpandCollapseColumn>
                                                            <Columns>
                                                         
                                                                <telerik:GridBoundColumn DataField="Yr" 
                                                                    FilterControlAltText="Filter Yr column" HeaderText="Year" 
                                                                    SortExpression="Yr" UniqueName="Yr">
                                                                </telerik:GridBoundColumn>                                                          
                                                             
                                                                <telerik:GridBoundColumn DataField="UW_Tat" 
                                                                    FilterControlAltText="Filter Process_Tat column" HeaderText="UW_Tat" 
                                                                    SortExpression="UW_Tat" UniqueName="UW_Tat">
                                                                </telerik:GridBoundColumn>
                                                            </Columns>
                                                            <EditFormSettings>
                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                </EditColumn>
                                                            </EditFormSettings>
                                                        </MasterTableView>
                                                        <ItemStyle Wrap="False" />
                                                        <FilterMenu EnableImageSprites="False">
                                                        </FilterMenu>
                                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                        </HeaderContextMenu>
                                                    </telerik:RadGrid>
                                                </asp:Panel>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="style8">
                                                <asp:Label ID="Label1" runat="server" style="font-weight: 700" Text="MONTH"></asp:Label>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="style8">
                                                <asp:Panel ID="Panel21" runat="server" Height="100%" ScrollBars="Both" 
                                                    Width="100%">
                                                    <telerik:RadGrid ID="GDMED_UW_1" runat="server" AllowPaging="True" 
                                                        CellSpacing="0" GridLines="None" Height="100%" Skin="Sunset" Width="100%">
                                                        <MasterTableView AutoGenerateColumns="False">
                                                            <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                            <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                            </RowIndicatorColumn>
                                                            <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                            </ExpandCollapseColumn>
                                                            <Columns>
                                                                <telerik:GridBoundColumn DataField="Yr" FilterControlAltText="Filter Yr column" 
                                                                    HeaderText="Year" SortExpression="Yr" UniqueName="Yr">
                                                                </telerik:GridBoundColumn>
                                                                <telerik:GridBoundColumn DataField="Mon" 
                                                                    FilterControlAltText="Filter Mon column" HeaderText="Mon" SortExpression="Mon" 
                                                                    UniqueName="Mon">
                                                                </telerik:GridBoundColumn>
                                                               
                                                                <telerik:GridBoundColumn DataField="UW_Tat" 
                                                                    FilterControlAltText="Filter UW_Tat column" HeaderText="UW_Tat" 
                                                                    SortExpression="UW_Tat" UniqueName="UW_Tat">
                                                                </telerik:GridBoundColumn>
                                                            </Columns>
                                                            <EditFormSettings>
                                                                <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                </EditColumn>
                                                            </EditFormSettings>
                                                        </MasterTableView>
                                                        <ItemStyle Wrap="False" />
                                                        <FilterMenu EnableImageSprites="False">
                                                        </FilterMenu>
                                                        <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                        </HeaderContextMenu>
                                                    </telerik:RadGrid>
                                                </asp:Panel>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td class="style8">
                                                <telerik:RadButton ID="RadButton3" runat="server" Skin="Simple" 
                                                    Text="Export data">
                                                </telerik:RadButton>
                                            </td>
                                        </tr>
                                    </table>
                                </asp:Panel>
                            </telerik:RadPageView>
                        </telerik:RadMultiPage>
                    </td>
                    <td>
                        &nbsp;</td>
                </tr>
                <tr>
                    <td colspan="4">
                        &nbsp;</td>
                </tr>
                <tr>
                    <td style="width: 105px">
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                    <td>
                        &nbsp;</td>
                </tr>
            </table>
        </ContentTemplate>
   
    </asp:UpdatePanel>
</asp:Content>

